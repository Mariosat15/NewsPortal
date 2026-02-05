import OpenAI from 'openai';
import { AgentConfig, AgentResult, GatheredTopic, RSSFeed } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default RSS feeds for German news - updated frequently with fresh content
const defaultRSSFeeds: RSSFeed[] = [
  // News - Major German sources with frequent updates
  { url: 'https://www.tagesschau.de/xml/rss2/', name: 'Tagesschau', category: 'news', language: 'de', enabled: true },
  { url: 'https://rss.sueddeutsche.de/rss/Topthemen', name: 'Süddeutsche', category: 'news', language: 'de', enabled: true },
  { url: 'https://www.zeit.de/news/index', name: 'Zeit Online', category: 'news', language: 'de', enabled: true },
  
  // Technology
  { url: 'https://www.heise.de/rss/heise-top-atom.xml', name: 'Heise', category: 'technology', language: 'de', enabled: true },
  { url: 'https://www.golem.de/rss.php?feed=RSS2.0', name: 'Golem', category: 'technology', language: 'de', enabled: true },
  
  // Finance
  { url: 'https://www.finanzen.net/rss/analysen', name: 'Finanzen.net', category: 'finance', language: 'de', enabled: true },
  
  // Sports
  { url: 'https://rss.kicker.de/live/bundesliga', name: 'Kicker', category: 'sports', language: 'de', enabled: true },
  
  // Health
  { url: 'https://www.aerzteblatt.de/rss/news.rss', name: 'Ärzteblatt', category: 'health', language: 'de', enabled: true },
  
  // Entertainment
  { url: 'https://www.moviepilot.de/api/rss/news', name: 'Moviepilot', category: 'entertainment', language: 'de', enabled: true },
];

// Calculate articles per category for even distribution
function calculateDistribution(maxArticles: number, categories: string[], distributeEvenly: boolean): Map<string, number> {
  const distribution = new Map<string, number>();
  
  if (!distributeEvenly || categories.length === 0) {
    // If not distributing evenly, give equal chance to all
    categories.forEach(cat => distribution.set(cat, Math.ceil(maxArticles / categories.length)));
    return distribution;
  }
  
  const baseCount = Math.floor(maxArticles / categories.length);
  const remainder = maxArticles % categories.length;
  
  categories.forEach((cat, index) => {
    // First 'remainder' categories get one extra article
    distribution.set(cat, baseCount + (index < remainder ? 1 : 0));
  });
  
  return distribution;
}

// Gather topics from RSS feeds and web sources
export async function gatherTopics(config: AgentConfig): Promise<AgentResult<GatheredTopic[]>> {
  const startTime = Date.now();
  const gatheredTopics: GatheredTopic[] = [];

  try {
    const useRSS = config.useRSSFeeds !== false;
    const rssFeeds = config.rssFeeds?.filter(f => f.enabled) || defaultRSSFeeds;
    const distributeEvenly = config.distributeEvenly !== false;
    
    // Calculate how many articles per category
    const categoryDistribution = calculateDistribution(
      config.maxArticlesPerRun || 5,
      config.topics,
      distributeEvenly
    );
    
    console.log(`Gathering topics - RSS enabled: ${useRSS}, Feeds: ${rssFeeds.length}`);
    console.log(`Distribution: ${JSON.stringify(Object.fromEntries(categoryDistribution))}`);

    // Track gathered counts per category
    const gatheredCounts = new Map<string, number>();
    config.topics.forEach(t => gatheredCounts.set(t, 0));

    // Step 1: Fetch from RSS feeds if enabled
    if (useRSS && rssFeeds.length > 0) {
      for (const feed of rssFeeds) {
        try {
          // Filter feeds by configured topics
          if (!config.topics.includes(feed.category)) continue;
          
          // Check if we need more for this category
          const targetCount = categoryDistribution.get(feed.category) || 1;
          const currentCount = gatheredCounts.get(feed.category) || 0;
          if (currentCount >= targetCount) continue;
          
          const items = await fetchRSSFeed(feed);
          if (items.length > 0) {
            gatheredTopics.push({
              id: `rss-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              topic: feed.category,
              category: feed.category,
              sources: items.slice(0, 5), // Limit items per feed
              gatheredAt: new Date(),
            });
            gatheredCounts.set(feed.category, currentCount + 1);
          }
        } catch (error) {
          console.error(`Error fetching RSS feed ${feed.name}:`, error);
        }
      }
    }

    // Step 2: Generate additional trending topics with AI for each category
    for (const topic of config.topics) {
      const targetCount = categoryDistribution.get(topic) || 1;
      const currentCount = gatheredCounts.get(topic) || 0;
      
      // Generate enough topics to meet the target
      while ((gatheredCounts.get(topic) || 0) < targetCount) {
        try {
          const aiTopics = await generateTrendingTopics(topic, config.defaultLanguage);
          if (aiTopics.length > 0) {
            gatheredTopics.push({
              id: `ai-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              topic,
              category: topic,
              sources: aiTopics,
              gatheredAt: new Date(),
            });
            gatheredCounts.set(topic, (gatheredCounts.get(topic) || 0) + 1);
          } else {
            // If AI returns nothing, break to avoid infinite loop
            break;
          }
        } catch (error) {
          console.error(`Error generating AI topics for ${topic}:`, error);
          break;
        }
      }
    }

    console.log(`Gathered ${gatheredTopics.length} topic groups with ${gatheredTopics.reduce((sum, t) => sum + t.sources.length, 0)} total sources`);
    console.log(`Final counts: ${JSON.stringify(Object.fromEntries(gatheredCounts))}`);

    return {
      success: true,
      data: gatheredTopics,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

// Fetch and parse RSS feed
async function fetchRSSFeed(feed: RSSFeed): Promise<GatheredTopic['sources']> {
  try {
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'NewsPortal/1.0 RSS Reader',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRSSXML(xml, feed);
    
    console.log(`Fetched ${items.length} items from ${feed.name}`);
    return items;
  } catch (error) {
    console.error(`Failed to fetch RSS from ${feed.name}:`, error);
    // Fallback to AI-generated content for this feed's category
    return [];
  }
}

// Check if a date is within the last N hours
function isRecentDate(dateStr: string, maxHoursOld: number = 48): boolean {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    
    const now = new Date();
    const hoursAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    return hoursAgo <= maxHoursOld;
  } catch {
    return false;
  }
}

// Parse RSS XML to extract items - ONLY RECENT ITEMS (last 48 hours)
function parseRSSXML(xml: string, feed: RSSFeed): GatheredTopic['sources'] {
  const items: GatheredTopic['sources'] = [];
  
  // Simple regex-based parsing for RSS items
  const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi);
  
  for (const match of itemMatches) {
    const itemXml = match[1];
    
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link') || extractTag(itemXml, 'guid');
    const description = extractTag(itemXml, 'description') || extractTag(itemXml, 'content:encoded');
    const pubDate = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'dc:date');
    
    // SKIP OLD ARTICLES - only include items from last 48 hours
    if (pubDate && !isRecentDate(pubDate, 48)) {
      console.log(`Skipping old article: "${title?.substring(0, 50)}..." (${pubDate})`);
      continue;
    }
    
    if (title && link) {
      // Clean HTML from description
      const cleanDescription = description
        ?.replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim()
        .substring(0, 500) || '';

      items.push({
        url: link,
        title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
        snippet: cleanDescription,
        source: feed.name,
        publishDate: pubDate || new Date().toISOString(),
      });
    }
    
    // Limit to 10 recent items per feed
    if (items.length >= 10) break;
  }
  
  console.log(`Found ${items.length} recent items (last 48h) from ${feed.name}`);
  return items;
}

// Extract content from XML tag
function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

// Generate trending topics using AI for comprehensive coverage
async function generateTrendingTopics(
  topic: string,
  language: 'de' | 'en'
): Promise<GatheredTopic['sources']> {
  const now = new Date();
  const currentDate = now.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentYear = now.getFullYear();
  const currentMonth = now.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { month: 'long' });

  const systemPrompt = language === 'de'
    ? `Du bist ein erfahrener Nachrichtenredakteur bei einer führenden deutschen Nachrichtenagentur.
       
       KRITISCH - AKTUALITÄT:
       - Heute ist ${currentDate} (Jahr ${currentYear})
       - Du MUSST NUR über Ereignisse schreiben, die HEUTE oder in den LETZTEN 24-48 STUNDEN passiert sind
       - KEINE alten Nachrichten, KEINE historischen Ereignisse, KEINE zeitlosen Themen
       - Jede Nachricht muss sich auf ein KONKRETES, AKTUELLES Ereignis beziehen
       - Verwende Formulierungen wie "heute", "gestern", "am Montag", "diese Woche"
       
       BEISPIELE für GUTE aktuelle Themen:
       - "Bundestag beschließt heute neues Gesetz..."
       - "DAX erreicht am Dienstag neuen Höchststand..."
       - "Wissenschaftler veröffentlichen diese Woche Studie..."
       
       BEISPIELE für SCHLECHTE/VERALTETE Themen (NICHT VERWENDEN):
       - Allgemeine Tipps oder Ratgeber
       - Historische Ereignisse
       - Zeitlose Analysen ohne aktuellen Bezug`
    : `You are an experienced news editor at a leading news agency.
       
       CRITICAL - FRESHNESS:
       - Today is ${currentDate} (Year ${currentYear})
       - You MUST ONLY write about events that happened TODAY or in the LAST 24-48 HOURS
       - NO old news, NO historical events, NO evergreen topics
       - Each story must reference a SPECIFIC, CURRENT event
       - Use phrases like "today", "yesterday", "on Monday", "this week"
       
       EXAMPLES of GOOD current topics:
       - "Congress passes new bill today..."
       - "Stock market reaches new high on Tuesday..."
       - "Scientists release study this week..."
       
       EXAMPLES of BAD/OUTDATED topics (DO NOT USE):
       - General tips or guides
       - Historical events
       - Timeless analysis without current reference`;

  const userPrompt = language === 'de'
    ? `Generiere 3 BRANDAKTUELLE Nachrichtenthemen für die Kategorie "${topic}".
       
       DATUM HEUTE: ${currentDate}
       
       STRENGE ANFORDERUNGEN:
       1. Jedes Thema MUSS ein Ereignis der letzten 24-48 Stunden beschreiben
       2. Verwende spezifische Zeitangaben (heute, gestern, diese Woche, am ${currentMonth})
       3. Beziehe dich auf konkrete aktuelle Entwicklungen ${currentYear}
       
       Für jedes Thema liefere:
       - Einen präzisen Nachrichtentitel mit Zeitbezug
       - Eine faktische Zusammenfassung (80-120 Wörter) mit aktuellen Details
       - Eine glaubwürdige aktuelle Quelle
       
       Antworte NUR als JSON Array:
       [{"title": "...", "snippet": "...", "source": "..."}]`
    : `Generate 3 BREAKING/CURRENT news topics for the category "${topic}".
       
       TODAY'S DATE: ${currentDate}
       
       STRICT REQUIREMENTS:
       1. Each topic MUST describe an event from the last 24-48 hours
       2. Use specific time references (today, yesterday, this week, in ${currentMonth})
       3. Reference concrete current developments in ${currentYear}
       
       For each topic provide:
       - A precise news headline with time reference
       - A factual summary (80-120 words) with current details
       - A credible current source
       
       Respond ONLY as JSON Array:
       [{"title": "...", "snippet": "...", "source": "..."}]`;

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const sources = JSON.parse(jsonMatch[0]);
    return sources.map((source: { title: string; snippet: string; source: string }, index: number) => ({
      url: `https://news.example.com/${topic}/${Date.now()}-${index}`,
      title: source.title,
      snippet: source.snippet,
      source: source.source,
      publishDate: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error generating trending topics:', error);
    return [];
  }
}

export { fetchRSSFeed, generateTrendingTopics };
