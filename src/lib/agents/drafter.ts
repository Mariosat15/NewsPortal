import OpenAI from 'openai';
import { AgentResult, DraftArticle, GatheredTopic, ArticleStyle, AIModelConfig } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default AI model configuration
const defaultAIConfig: AIModelConfig = {
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 4000,
  topP: 0.9,
  frequencyPenalty: 0.3,
  presencePenalty: 0.3,
};

// Default article style
const defaultArticleStyle: ArticleStyle = {
  type: 'news',
  tone: 'engaging',
  depth: 'standard',
  includeImages: true,
  includeQuotes: true,
  includeSources: true,
};

// Curated Unsplash images by category
const categoryImages: Record<string, string[]> = {
  news: [
    '1495020689067-958852a7765e', '1504711434969-e33886168f5c', '1585829365295-ab7cd400c167',
    '1557804506-669a67965ba0', '1478476868527-002ae3f3e159'
  ],
  technology: [
    '1518770660439-4636190af475', '1550751827-4bd374c3f58b', '1531297484001-80022131f5a1',
    '1488590528505-98d2b5aba04b', '1526374965328-7f61d4dc18c5'
  ],
  health: [
    '1498837167922-ddd27525d352', '1505576399279-565b52d4ac71', '1571019613454-1cb2f99b2d8b',
    '1532938911079-1b06ac7ceec7', '1559757148-5c350d0d3c56'
  ],
  finance: [
    '1579621970563-ebec7560ff3e', '1560472354-b33ff0c44a43', '1554224155-6726b3ff858f',
    '1611974789855-9c2a0a7236a3', '1590283603385-17ffb3a7f29f'
  ],
  sports: [
    '1546519638-68e109498ffc', '1517649763962-0c623066013b', '1471295253337-3ceaaedca402',
    '1574629810360-7efbbe195018', '1552674605-db6ffd4facb5'
  ],
  lifestyle: [
    '1441986300917-64674bd600d8', '1506905925346-21bda4d32df4', '1493612276216-ee3925520721',
    '1529156069898-49953e39b3ac', '1500530855697-b586d89ba3ee'
  ],
  entertainment: [
    '1489599849927-2ee91cede3ba', '1524368535928-5b5e00ddc76b', '1470229722913-7c0e2dbbafd3',
    '1598899134739-24c46f58b8c0', '1514525253161-7a46d19cd819'
  ],
};

// Create draft articles from gathered topics
export async function createDrafts(
  topics: GatheredTopic[],
  language: 'de' | 'en',
  maxArticles: number = 5,
  aiConfig: AIModelConfig = defaultAIConfig,
  articleStyle: ArticleStyle = defaultArticleStyle
): Promise<AgentResult<DraftArticle[]>> {
  const startTime = Date.now();
  const drafts: DraftArticle[] = [];

  try {
    const topicsToProcess = topics.slice(0, maxArticles);

    for (const topic of topicsToProcess) {
      try {
        const draft = await createDraftFromTopic(topic, language, aiConfig, articleStyle);
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

// Create a professional news article from a gathered topic
async function createDraftFromTopic(
  topic: GatheredTopic,
  language: 'de' | 'en',
  aiConfig: AIModelConfig,
  articleStyle: ArticleStyle
): Promise<DraftArticle | null> {
  const sourcesText = topic.sources
    .map((s) => `- ${s.title}\n  ${s.snippet}\n  Quelle: ${s.source}`)
    .join('\n\n');

  const images = categoryImages[topic.category] || categoryImages.news;
  const randomImages = images.sort(() => Math.random() - 0.5).slice(0, 3);

  // Build dynamic system prompt based on article style
  const styleInstructions = getStyleInstructions(articleStyle, language);
  const formatInstructions = getFormatInstructions(articleStyle, language, randomImages);

  const systemPrompt = language === 'de'
    ? `Du bist ein preisgekrönter Journalist bei einer führenden internationalen Nachrichtenagentur.
       Du schreibst ${getArticleTypeLabel(articleStyle.type, 'de')} in einem ${getToneLabel(articleStyle.tone, 'de')} Stil.
       
       DEIN JOURNALISTISCHER STANDARD:
       ${styleInstructions}
       
       QUALITÄTSKRITERIEN:
       - Faktentreue und Genauigkeit haben höchste Priorität
       - Klare Struktur: Wichtigstes zuerst (Nachrichtenpyramide)
       - Lebendige, aber präzise Sprache
       - Kontext und Hintergrundinformationen liefern
       - Verschiedene Perspektiven berücksichtigen
       - Aktualität und Relevanz betonen`
    : `You are an award-winning journalist at a leading international news agency.
       You write ${getArticleTypeLabel(articleStyle.type, 'en')} in a ${getToneLabel(articleStyle.tone, 'en')} style.
       
       YOUR JOURNALISTIC STANDARDS:
       ${styleInstructions}
       
       QUALITY CRITERIA:
       - Factual accuracy is the highest priority
       - Clear structure: most important first (inverted pyramid)
       - Vivid but precise language
       - Provide context and background information
       - Consider different perspectives
       - Emphasize timeliness and relevance`;

  const userPrompt = language === 'de'
    ? `AUFGABE: Schreibe einen professionellen ${getArticleTypeLabel(articleStyle.type, 'de')} basierend auf folgenden Quellen.

KATEGORIE: ${topic.category}
QUELLINFORMATIONEN:
${sourcesText}

${formatInstructions}

WICHTIG:
- Schreibe EINZIGARTIGEN Inhalt - kein Copy-Paste aus Quellen
- Synthetisiere Informationen zu einer kohärenten Geschichte
- Füge eigene Analyse und Kontext hinzu
- Verwende die bereitgestellten Bild-URLs an passenden Stellen
- Qualität vor Quantität

Antworte NUR als JSON (ohne Markdown-Codeblöcke):
{
  "title": "Prägnanter, aufmerksamkeitsstarker Titel (max 80 Zeichen)",
  "teaser": "Zusammenfassung mit dem Wichtigsten (2-3 Sätze, 150-200 Zeichen)",
  "content": "Vollständiger HTML-formatierter Artikel",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`
    : `TASK: Write a professional ${getArticleTypeLabel(articleStyle.type, 'en')} based on the following sources.

CATEGORY: ${topic.category}
SOURCE INFORMATION:
${sourcesText}

${formatInstructions}

IMPORTANT:
- Write UNIQUE content - no copy-paste from sources
- Synthesize information into a coherent story
- Add your own analysis and context
- Use the provided image URLs at appropriate places
- Quality over quantity

Respond ONLY as JSON (no markdown code blocks):
{
  "title": "Concise, attention-grabbing title (max 80 characters)",
  "teaser": "Summary with the essentials (2-3 sentences, 150-200 characters)",
  "content": "Complete HTML-formatted article",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: aiConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: aiConfig.temperature,
      max_tokens: aiConfig.maxTokens,
      top_p: aiConfig.topP,
      frequency_penalty: aiConfig.frequencyPenalty,
      presence_penalty: aiConfig.presencePenalty,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

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

// Get style-specific instructions
function getStyleInstructions(style: ArticleStyle, language: 'de' | 'en'): string {
  const instructions: Record<ArticleStyle['type'], { de: string; en: string }> = {
    news: {
      de: `- Objektive, faktenbasierte Berichterstattung
- Wer, Was, Wann, Wo, Warum, Wie beantworten
- Zitate von relevanten Personen/Experten einbinden
- Chronologische oder thematische Struktur`,
      en: `- Objective, fact-based reporting
- Answer Who, What, When, Where, Why, How
- Include quotes from relevant people/experts
- Chronological or thematic structure`
    },
    analysis: {
      de: `- Tiefgehende Analyse der Fakten und Zusammenhänge
- Expertenmeinungen und verschiedene Perspektiven
- Historischer Kontext und Vergleiche
- Ausblick auf mögliche Entwicklungen`,
      en: `- Deep analysis of facts and connections
- Expert opinions and different perspectives
- Historical context and comparisons
- Outlook on possible developments`
    },
    opinion: {
      de: `- Klare Meinung und Argumentation
- Belege und Beispiele für die Position
- Gegenargumente anerkennen und entkräften
- Persönlicher aber fundierter Standpunkt`,
      en: `- Clear opinion and argumentation
- Evidence and examples for the position
- Acknowledge and refute counterarguments
- Personal but well-founded standpoint`
    },
    summary: {
      de: `- Kompakte Zusammenfassung der wichtigsten Punkte
- Bullet Points für Übersichtlichkeit
- Die 5 wichtigsten Erkenntnisse hervorheben
- Schnell erfassbar und informativ`,
      en: `- Compact summary of key points
- Bullet points for clarity
- Highlight the 5 most important findings
- Quick to grasp and informative`
    },
    investigative: {
      de: `- Recherche-basierter Tiefgang
- Dokumente und Daten als Belege
- Verbindungen und Muster aufdecken
- Konsequenzen und Bedeutung erklären`,
      en: `- Research-based depth
- Documents and data as evidence
- Reveal connections and patterns
- Explain consequences and significance`
    }
  };
  
  return instructions[style.type][language];
}

// Get format instructions
function getFormatInstructions(style: ArticleStyle, language: 'de' | 'en', images: string[]): string {
  const wordCount = style.depth === 'brief' ? '300-500' : style.depth === 'standard' ? '500-800' : '800-1500';
  
  const imageInstructions = style.includeImages 
    ? language === 'de'
      ? `\nBILDER (füge mindestens 2 ein):
- https://images.unsplash.com/photo-${images[0]}?w=800&h=450&fit=crop
- https://images.unsplash.com/photo-${images[1]}?w=800&h=450&fit=crop
- https://images.unsplash.com/photo-${images[2]}?w=800&h=450&fit=crop

Bildformat: <figure class="article-image"><img src="URL" alt="Beschreibung" /><figcaption>Bildunterschrift</figcaption></figure>`
      : `\nIMAGES (include at least 2):
- https://images.unsplash.com/photo-${images[0]}?w=800&h=450&fit=crop
- https://images.unsplash.com/photo-${images[1]}?w=800&h=450&fit=crop
- https://images.unsplash.com/photo-${images[2]}?w=800&h=450&fit=crop

Image format: <figure class="article-image"><img src="URL" alt="Description" /><figcaption>Caption</figcaption></figure>`
    : '';

  const quoteInstructions = style.includeQuotes
    ? language === 'de'
      ? '\n- Füge mindestens 1-2 Zitate ein (<blockquote>)'
      : '\n- Include at least 1-2 quotes (<blockquote>)'
    : '';

  const sourceInstructions = style.includeSources
    ? language === 'de'
      ? '\n- Quellenangaben im Text verarbeiten'
      : '\n- Process source citations in the text'
    : '';

  return language === 'de'
    ? `FORMATIERUNG (${wordCount} Wörter):
- Mindestens 4-5 Abschnitte mit <h2> Überschriften
- Kurze Absätze (2-3 Sätze) in <p> Tags
- Wichtige Begriffe mit <strong> hervorheben
- Listen mit <ul><li> wo sinnvoll${quoteInstructions}${sourceInstructions}${imageInstructions}

STRUKTUR:
1. Einleitung - Das Wichtigste zusammenfassen
2. Hauptteil - Details und Kontext
3. Vertiefung - Analyse und Hintergründe
4. Ausblick/Fazit - Bedeutung und Perspektiven`
    : `FORMATTING (${wordCount} words):
- At least 4-5 sections with <h2> headings
- Short paragraphs (2-3 sentences) in <p> tags
- Highlight important terms with <strong>
- Use <ul><li> for lists where appropriate${quoteInstructions}${sourceInstructions}${imageInstructions}

STRUCTURE:
1. Introduction - Summarize the essentials
2. Main part - Details and context
3. Deep dive - Analysis and background
4. Outlook/Conclusion - Significance and perspectives`;
}

// Get article type label
function getArticleTypeLabel(type: ArticleStyle['type'], language: 'de' | 'en'): string {
  const labels: Record<ArticleStyle['type'], { de: string; en: string }> = {
    news: { de: 'Nachrichtenartikel', en: 'news articles' },
    analysis: { de: 'Analysen', en: 'analysis pieces' },
    opinion: { de: 'Meinungsbeiträge', en: 'opinion pieces' },
    summary: { de: 'Zusammenfassungen', en: 'summary articles' },
    investigative: { de: 'investigative Berichte', en: 'investigative reports' },
  };
  return labels[type][language];
}

// Get tone label
function getToneLabel(tone: ArticleStyle['tone'], language: 'de' | 'en'): string {
  const labels: Record<ArticleStyle['tone'], { de: string; en: string }> = {
    neutral: { de: 'neutralen und objektiven', en: 'neutral and objective' },
    engaging: { de: 'fesselnden und dynamischen', en: 'engaging and dynamic' },
    formal: { de: 'formellen und professionellen', en: 'formal and professional' },
    conversational: { de: 'gesprächigen und zugänglichen', en: 'conversational and approachable' },
  };
  return labels[tone][language];
}

export { createDraftFromTopic };
