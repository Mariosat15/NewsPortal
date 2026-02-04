import OpenAI from 'openai';
import { AgentResult, DraftArticle, GatheredTopic } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create draft articles from gathered topics
export async function createDrafts(
  topics: GatheredTopic[],
  language: 'de' | 'en',
  maxArticles: number = 5
): Promise<AgentResult<DraftArticle[]>> {
  const startTime = Date.now();
  const drafts: DraftArticle[] = [];

  try {
    // Limit to maxArticles
    const topicsToProcess = topics.slice(0, maxArticles);

    for (const topic of topicsToProcess) {
      try {
        const draft = await createDraftFromTopic(topic, language);
        if (draft) {
          drafts.push(draft);
        }
      } catch (error) {
        console.error(`Error creating draft for topic ${topic.id}:`, error);
      }
    }

    return {
      success: true,
      data: drafts,
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

// Create a draft article from a gathered topic
async function createDraftFromTopic(
  topic: GatheredTopic,
  language: 'de' | 'en'
): Promise<DraftArticle | null> {
  const sourcesText = topic.sources
    .map((s) => `- ${s.title}: ${s.snippet} (Quelle: ${s.source})`)
    .join('\n');

  const systemPrompt = language === 'de'
    ? `Du bist ein professioneller Journalist, der informative und gut recherchierte Artikel auf Deutsch schreibt.
       Schreibe in einem professionellen aber zugänglichen Stil.
       Verwende Zwischenüberschriften zur Strukturierung.
       Der Artikel sollte informativ, faktisch korrekt und für ein deutsches Publikum relevant sein.`
    : `You are a professional journalist who writes informative and well-researched articles in English.
       Write in a professional but accessible style.
       Use subheadings for structure.
       The article should be informative, factually accurate, and relevant for readers.`;

  const userPrompt = language === 'de'
    ? `Basierend auf den folgenden Quellen, schreibe einen vollständigen Nachrichtenartikel.

Thema: ${topic.topic}
Kategorie: ${topic.category}

Quellen:
${sourcesText}

Erstelle einen Artikel mit:
1. Einem packenden Titel (max 80 Zeichen)
2. Einem Teaser/Zusammenfassung (2-3 Sätze, ca. 200 Zeichen)
3. Vollständiger Artikeltext (400-600 Wörter) mit HTML-Formatierung (<h2>, <p>, <strong>)
4. 3-5 relevante Tags

Antworte im JSON-Format:
{
  "title": "...",
  "teaser": "...",
  "content": "...",
  "tags": ["...", "..."]
}`
    : `Based on the following sources, write a complete news article.

Topic: ${topic.topic}
Category: ${topic.category}

Sources:
${sourcesText}

Create an article with:
1. A compelling title (max 80 characters)
2. A teaser/summary (2-3 sentences, about 200 characters)
3. Full article text (400-600 words) with HTML formatting (<h2>, <p>, <strong>)
4. 3-5 relevant tags

Respond in JSON format:
{
  "title": "...",
  "teaser": "...",
  "content": "...",
  "tags": ["...", "..."]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const articleData = JSON.parse(jsonMatch[0]);

    return {
      id: `draft-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      topicId: topic.id,
      title: articleData.title,
      teaser: articleData.teaser,
      content: articleData.content,
      category: topic.category,
      tags: articleData.tags || [],
      sources: topic.sources.map((s) => s.url),
      language,
      draftedAt: new Date(),
    };
  } catch (error) {
    console.error('Error in createDraftFromTopic:', error);
    return null;
  }
}

export { createDraftFromTopic };
