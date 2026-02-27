/**
 * Video Fetcher — Embeds topic-relevant videos in articles
 *
 * Strategy (executed AFTER the article is generated so we have the real title):
 *   1. Use OpenAI to generate an optimal YouTube search query from article title + category
 *   2. Search via Bright Data SERP (if BRIGHTDATA_API_TOKEN set) — returns multiple candidates
 *   3. Score candidates by keyword overlap with article title
 *   4. Return the best match, or nothing — no video is better than an irrelevant one
 *
 * No hardcoded / curated video IDs. No YouTube API key required.
 */

import OpenAI from 'openai';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VideoResult {
  platform: 'youtube' | 'tiktok';
  videoId: string;
  title: string;
  thumbnail: string;
  embedUrl: string;
  duration?: string;
  channel?: string;
  relevanceScore?: number; // 0-1 — how closely it matches the article
}

// ---------------------------------------------------------------------------
// OpenAI instance (reuses the same key the rest of the agent pipeline uses)
// ---------------------------------------------------------------------------

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// ---------------------------------------------------------------------------
// 1) AI-powered search query generation
// ---------------------------------------------------------------------------

/**
 * Uses OpenAI to distil the article title + category into an optimal
 * 4-8 word YouTube search query that will surface a topically relevant video.
 */
async function generateSearchQuery(
  articleTitle: string,
  articleTeaser: string,
  category: string,
  language: 'de' | 'en'
): Promise<string> {
  try {
    const openai = getOpenAI();
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const systemPrompt =
      language === 'de'
        ? `Du bist ein YouTube-Suchexperte. Generiere eine präzise YouTube-Suchquery (4-8 Wörter) die ein thematisch passendes, seriöses Video zu einem Nachrichtenartikel findet. Die Query muss spezifisch zum Artikelthema sein — KEINE generischen Begriffe wie nur die Kategorie. Antworte NUR mit der Suchquery, nichts anderes.`
        : `You are a YouTube search expert. Generate a precise YouTube search query (4-8 words) that will find a topically relevant, reputable video matching a news article. The query must be specific to the article topic — NO generic terms like just the category name. Reply ONLY with the search query, nothing else.`;

    const userPrompt =
      language === 'de'
        ? `Artikel-Titel: "${articleTitle}"\nKategorie: ${category}\nTeaser: ${articleTeaser}\n\nGeneriere die beste YouTube-Suchquery:`
        : `Article title: "${articleTitle}"\nCategory: ${category}\nTeaser: ${articleTeaser}\n\nGenerate the best YouTube search query:`;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 60,
    });

    const query = response.choices[0]?.message?.content?.trim();
    if (query && query.length > 3 && query.length < 120) {
      console.log(`[VideoFetcher] AI search query: "${query}"`);
      return query;
    }
  } catch (error) {
    console.warn('[VideoFetcher] AI query generation failed, using title fallback:', error);
  }

  // Fallback: extract key words from title
  const fallback = articleTitle
    .replace(/[^a-zA-ZäöüÄÖÜß0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 6)
    .join(' ');

  console.log(`[VideoFetcher] Fallback search query: "${fallback}"`);
  return fallback || articleTitle.slice(0, 60);
}

// ---------------------------------------------------------------------------
// 2) Bright Data YouTube SERP search (multiple candidates)
// ---------------------------------------------------------------------------

async function searchWithBrightData(query: string): Promise<VideoResult[]> {
  const apiToken = process.env.BRIGHTDATA_API_TOKEN;
  if (!apiToken) {
    console.log('[VideoFetcher] No BRIGHTDATA_API_TOKEN — skipping Bright Data search');
    return [];
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('https://api.brightdata.com/serp/req', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        country: 'us',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`[VideoFetcher] Bright Data HTTP ${response.status}`);
      return [];
    }

    const html = await response.text();

    // Extract ALL video IDs + surrounding title text from the YouTube results page
    const candidates: VideoResult[] = [];
    const seen = new Set<string>();

    // Pattern 1: watch?v= links (most common in YouTube HTML)
    const watchRegex = /watch\?v=([a-zA-Z0-9_-]{11})/g;
    let match: RegExpExecArray | null;
    while ((match = watchRegex.exec(html)) !== null) {
      const videoId = match[1];
      if (seen.has(videoId)) continue;
      seen.add(videoId);

      // Try to extract the title near this video reference
      const contextStart = Math.max(0, match.index - 300);
      const contextEnd = Math.min(html.length, match.index + 300);
      const context = html.slice(contextStart, contextEnd);
      const titleMatch = context.match(/"title":\s*\{"runs":\[\{"text":"([^"]+)"\}/);
      const altTitleMatch = context.match(/"text":"([^"]{10,80})"/);
      const title = titleMatch?.[1] || altTitleMatch?.[1] || '';

      candidates.push({
        platform: 'youtube',
        videoId,
        title: title || query,
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      });

      // Limit to 10 candidates for scoring
      if (candidates.length >= 10) break;
    }

    console.log(`[VideoFetcher] Bright Data returned ${candidates.length} candidates for: "${query}"`);
    return candidates;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`[VideoFetcher] Bright Data error: ${msg}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 3) Relevance scoring
// ---------------------------------------------------------------------------

/**
 * Scores how relevant a video is to the article by keyword overlap.
 * Returns a value between 0 and 1.
 */
function scoreRelevance(video: VideoResult, articleTitle: string, category: string): number {
  if (!video.title || video.title === articleTitle) {
    // video.title is the search query itself (no real title extracted) — low confidence
    return 0.2;
  }

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-zA-ZäöüÄÖÜß0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const articleWords = new Set(normalize(articleTitle));
  const categoryWords = new Set(normalize(category));
  const videoWords = normalize(video.title);

  if (videoWords.length === 0) return 0.1;

  let matchCount = 0;
  let categoryMatchCount = 0;

  for (const word of videoWords) {
    if (articleWords.has(word)) matchCount++;
    if (categoryWords.has(word)) categoryMatchCount++;
  }

  // Score: ratio of matching article keywords found in video title
  const articleScore = articleWords.size > 0 ? matchCount / articleWords.size : 0;
  const categoryBonus = categoryMatchCount > 0 ? 0.1 : 0;

  return Math.min(1, articleScore + categoryBonus);
}

// ---------------------------------------------------------------------------
// 4) Embed HTML generation
// ---------------------------------------------------------------------------

export function generateVideoEmbed(video: VideoResult): string {
  if (video.platform === 'youtube') {
    return `
<div class="video-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 24px 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
  <iframe 
    src="https://www.youtube.com/embed/${video.videoId}?rel=0&modestbranding=1" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; border-radius: 12px;"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    allowfullscreen
    loading="lazy"
    title="${(video.title || 'Video').replace(/"/g, '&quot;')}"
  ></iframe>
</div>`;
  }

  if (video.platform === 'tiktok') {
    return `
<div class="video-embed" style="max-width: 325px; margin: 24px auto;">
  <blockquote 
    class="tiktok-embed" 
    cite="https://www.tiktok.com/video/${video.videoId}" 
    data-video-id="${video.videoId}"
    style="max-width: 325px; min-width: 250px;"
  >
    <section>${(video.title || 'TikTok Video').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</section>
  </blockquote>
  <script async src="https://www.tiktok.com/embed.js"></script>
</div>`;
  }

  return '';
}

// ---------------------------------------------------------------------------
// 5) Main entry point — called AFTER article generation
// ---------------------------------------------------------------------------

/**
 * Find a relevant video for an already-generated article.
 *
 * @param articleTitle  – The AI-generated article title (specific, not a category)
 * @param articleTeaser – The AI-generated article teaser / summary
 * @param category      – The article category (news, technology, etc.)
 * @param language      – de | en
 * @param includeYouTube – whether to search YouTube
 * @param includeTikTok  – whether to search TikTok (reserved for future use)
 */
export async function getVideoForArticle(
  articleTitle: string,
  articleTeaser: string,
  category: string,
  language: 'de' | 'en',
  includeYouTube: boolean = true,
  includeTikTok: boolean = false
): Promise<{ video: VideoResult | null; embedHtml: string }> {
  if (!includeYouTube && !includeTikTok) {
    return { video: null, embedHtml: '' };
  }

  console.log(`[VideoFetcher] Searching video for article: "${articleTitle}" [${category}]`);

  // Step 1: Generate an optimised search query using AI
  const searchQuery = await generateSearchQuery(articleTitle, articleTeaser, category, language);

  if (!searchQuery || searchQuery.length < 3) {
    console.log('[VideoFetcher] Could not generate a valid search query');
    return { video: null, embedHtml: '' };
  }

  // Step 2: Search via Bright Data
  let candidates: VideoResult[] = [];
  if (includeYouTube) {
    candidates = await searchWithBrightData(searchQuery);
  }

  // Step 3: Score and pick the best candidate
  if (candidates.length > 0) {
    const scored = candidates.map((v) => ({
      ...v,
      relevanceScore: scoreRelevance(v, articleTitle, category),
    }));

    // Sort by relevance (descending)
    scored.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

    const best = scored[0];
    console.log(
      `[VideoFetcher] Best candidate: "${best.title}" (score: ${best.relevanceScore?.toFixed(2)}, id: ${best.videoId})`
    );

    // Accept any candidate from the search results — the AI-generated query
    // already ensures topical relevance. We just pick the best scored one.
    // However, if we have a title and it scores 0 (zero keyword overlap), skip it.
    if (best.relevanceScore !== undefined && best.relevanceScore <= 0) {
      console.log('[VideoFetcher] Best candidate scored 0 — skipping');
      return { video: null, embedHtml: '' };
    }

    const embedHtml = generateVideoEmbed(best);
    return { video: best, embedHtml };
  }

  // No Bright Data token or search returned nothing — log and return empty
  console.log('[VideoFetcher] No video found (no Bright Data token or no results)');
  return { video: null, embedHtml: '' };
}

// ---------------------------------------------------------------------------
// Utility export (for potential future use)
// ---------------------------------------------------------------------------

export async function searchVideos(
  query: string,
  _platforms: ('youtube' | 'tiktok')[] = ['youtube'],
  _maxPerPlatform: number = 1
): Promise<VideoResult[]> {
  return searchWithBrightData(query);
}
