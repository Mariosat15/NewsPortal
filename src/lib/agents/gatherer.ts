import OpenAI from 'openai';
import { AgentConfig, AgentResult, GatheredTopic, RSSFeed } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default RSS feeds for German news
const defaultRSSFeeds: RSSFeed[] = [
  { url: 'https://www.tagesschau.de/xml/rss2/', name: 'Tagesschau', category: 'news', language: 'de', enabled: true },
  { url: 'https://www.spiegel.de/schlagzeilen/index.rss', name: 'Spiegel', category: 'news', language: 'de', enabled: true },
  { url: 'https://www.heise.de/rss/heise-top-atom.xml', name: 'Heise', category: 'technology', language: 'de', enabled: true },
];

// Gather topics from RSS feeds and web sources
export async function gatherTopics(config: AgentConfig): Promise<AgentResult<GatheredTopic[]>> {
  const startTime = Date.now();
  const gatheredTopics: GatheredTopic[] = [];

  try {
    const useRSS = config.useRSSFeeds !== false;
    const rssFeeds = config.rssFeeds?.filter(f => f.enabled) || defaultRSSFeeds;
    
    console.log(`Gathering topics - RSS enabled: ${useRSS}, Feeds: ${rssFeeds.length}`);

    // Step 1: Fetch from RSS feeds if enabled
    if (useRSS && rssFeeds.length > 0) {
      for (const feed of rssFeeds) {
        try {
          // Filter feeds by configured topics
          if (!config.topics.includes(feed.category)) continue;
          
          const items = await fetchRSSFeed(feed);
          if (items.length > 0) {
            gatheredTopics.push({
              id: `rss-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              topic: feed.category,
              category: feed.category,
              sources: items.slice(0, 5), // Limit items per feed
              gatheredAt: new Date(),
            });
          }
        } catch (error) {
          console.error(`Error fetching RSS feed ${feed.name}:`, error);
        }
      }
    }

    // Step 2: Generate additional trending topics with AI
    for (const topic of config.topics) {
      // Skip if we already have enough sources for this topic from RSS
      const existingForTopic = gatheredTopics.filter(t => t.category === topic);
      if (existingForTopic.length >= 2) continue;

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
        }
      } catch (error) {
        console.error(`Error generating AI topics for ${topic}:`, error);
      }
    }

    console.log(`Gathered ${gatheredTopics.length} topic groups with ${gatheredTopics.reduce((sum, t) => sum + t.sources.length, 0)} total sources`);

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

// Parse RSS XML to extract items
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
    
    // Limit to 10 items per feed
    if (items.length >= 10) break;
  }
  
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
  const currentDate = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const systemPrompt = language === 'de'
    ? `Du bist ein erfahrener Nachrichtenredakteur bei einer führenden deutschen Nachrichtenagentur (wie dpa, Reuters, AFP).
       Deine Aufgabe ist es, die aktuellsten und relevantesten Nachrichtenthemen zu identifizieren.
       
       WICHTIG:
       - Konzentriere dich auf AKTUELLE Ereignisse und Entwicklungen
       - Jedes Thema muss nachrichtenwürdig und von öffentlichem Interesse sein
       - Verwende realistische Quellen (etablierte Medien, offizielle Stellen)
       - Die Informationen sollten faktenbasiert und verifizierbar klingen
       - Datum heute: ${currentDate}`
    : `You are an experienced news editor at a leading news agency (like AP, Reuters, AFP).
       Your task is to identify the most current and relevant news topics.
       
       IMPORTANT:
       - Focus on CURRENT events and developments
       - Each topic must be newsworthy and of public interest
       - Use realistic sources (established media, official sources)
       - Information should sound fact-based and verifiable
       - Today's date: ${currentDate}`;

  const userPrompt = language === 'de'
    ? `Generiere 3 aktuelle, relevante Nachrichtenthemen für die Kategorie "${topic}".
       
       Für jedes Thema liefere:
       - Einen präzisen Nachrichtentitel (wie bei dpa/Reuters)
       - Eine faktische Zusammenfassung (80-120 Wörter) mit konkreten Details
       - Eine glaubwürdige Quelle (Behörde, Institut, Unternehmen)
       
       Die Themen sollten:
       - Aktuell und relevant für deutsche Leser sein
       - Konkrete Fakten, Zahlen oder Zitate enthalten
       - Verschiedene Aspekte der Kategorie abdecken
       
       Antworte NUR als JSON Array:
       [{"title": "...", "snippet": "...", "source": "..."}]`
    : `Generate 3 current, relevant news topics for the category "${topic}".
       
       For each topic provide:
       - A precise news headline (like AP/Reuters style)
       - A factual summary (80-120 words) with concrete details
       - A credible source (agency, institute, company)
       
       Topics should be:
       - Current and relevant for readers
       - Include concrete facts, figures, or quotes
       - Cover different aspects of the category
       
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
