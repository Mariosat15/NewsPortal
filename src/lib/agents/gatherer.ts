import OpenAI from 'openai';
import { AgentConfig, AgentResult, GatheredTopic } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Topic to search query mapping
const topicSearchQueries: Record<string, string[]> = {
  news: ['aktuelle nachrichten deutschland', 'breaking news germany', 'politik deutschland aktuell'],
  lifestyle: ['lifestyle trends 2026', 'mode beauty tipps', 'promi news deutschland'],
  technology: ['tech news innovation', 'AI artificial intelligence news', 'gadgets technology 2026'],
  sports: ['bundesliga fussball news', 'sport aktuell deutschland', 'champions league'],
  health: ['gesundheit tipps', 'wellness fitness news', 'ernährung gesundheit'],
  finance: ['finanzen geld sparen', 'aktien börse news', 'kryptowährung bitcoin'],
  entertainment: ['film serien streaming', 'musik charts 2026', 'gaming news'],
};

// Gather topics from web using simulated web search
// In production, this would use BrightData MCP for real web scraping
export async function gatherTopics(config: AgentConfig): Promise<AgentResult<GatheredTopic[]>> {
  const startTime = Date.now();
  const gatheredTopics: GatheredTopic[] = [];

  try {
    for (const topic of config.topics) {
      const queries = topicSearchQueries[topic] || [`${topic} news aktuell`];
      
      for (const query of queries.slice(0, 2)) { // Limit queries per topic
        try {
          // Use OpenAI to generate simulated search results
          // In production, replace with actual BrightData web scraping
          const searchResults = await simulateWebSearch(query, config.defaultLanguage);
          
          if (searchResults.length > 0) {
            gatheredTopics.push({
              id: `topic-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              topic,
              category: topic,
              sources: searchResults,
              gatheredAt: new Date(),
            });
          }
        } catch (error) {
          console.error(`Error gathering topic ${topic}:`, error);
        }
      }
    }

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

// Simulate web search results using OpenAI
// Replace with actual BrightData MCP integration in production
async function simulateWebSearch(
  query: string,
  language: 'de' | 'en'
): Promise<GatheredTopic['sources']> {
  const prompt = language === 'de'
    ? `Generiere 3 realistische Nachrichtenquellen zum Thema "${query}". 
       Für jede Quelle gib an: Titel, kurze Beschreibung (50 Wörter), und Quellenname.
       Format: JSON Array mit {title, snippet, source}`
    : `Generate 3 realistic news sources about "${query}".
       For each source provide: title, short description (50 words), and source name.
       Format: JSON Array with {title, snippet, source}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a news aggregator that generates realistic news headlines and summaries. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const sources = JSON.parse(jsonMatch[0]);
    return sources.map((source: { title: string; snippet: string; source: string }, index: number) => ({
      url: `https://example.com/news/${Date.now()}-${index}`,
      title: source.title,
      snippet: source.snippet,
      source: source.source,
      publishDate: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error in simulateWebSearch:', error);
    return [];
  }
}

// BrightData MCP integration for real web scraping
// Uncomment and use when BrightData is configured
/*
async function searchWithBrightData(query: string): Promise<GatheredTopic['sources']> {
  const response = await fetch('https://api.brightdata.com/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.BRIGHTDATA_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      zone: process.env.BRIGHTDATA_ZONE || 'web_unlocker1',
      limit: 5,
    }),
  });

  if (!response.ok) {
    throw new Error(`BrightData API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results.map((result: any) => ({
    url: result.url,
    title: result.title,
    snippet: result.snippet,
    source: new URL(result.url).hostname,
    publishDate: result.date,
  }));
}
*/

export { simulateWebSearch };
