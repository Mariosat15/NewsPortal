import OpenAI from 'openai';
import { AgentResult, DraftArticle, GatheredTopic, ArticleStyle, AIModelConfig, ArticleType } from './types';

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
  types: ['news'],
  tone: 'engaging',
  depth: 'standard',
  includeImages: true,
  includeQuotes: true,
  includeSources: true,
};

// Select article type based on category - STRICT mapping
function selectArticleType(style: ArticleStyle, category: string): ArticleType {
  const types = style.types || (style.type ? [style.type] : ['news']);
  const cat = category.toLowerCase();
  
  // STRICT category-to-type mapping (primary type for each category)
  const categoryPrimaryType: Record<string, ArticleType> = {
    'recipes': 'recipe',
    'health': 'guide',
    'finance': 'analysis',
    'technology': 'review',
    'lifestyle': 'guide',
    'entertainment': 'review',
    'relationships': 'guide',
    'travel': 'guide',
    'sports': 'news',
    'news': 'news',
  };
  
  // If category has a strict mapping and that type is enabled, use it
  const primaryType = categoryPrimaryType[cat];
  if (primaryType && types.includes(primaryType)) {
    console.log(`[Drafter] Category "${category}" -> Type "${primaryType}" (strict mapping)`);
    return primaryType;
  }
  
  // Secondary preferences if primary not available
  const categorySecondary: Record<string, ArticleType[]> = {
    'recipes': ['guide', 'listicle'],
    'health': ['news', 'listicle', 'analysis'],
    'finance': ['news', 'guide'],
    'technology': ['news', 'guide', 'analysis'],
    'lifestyle': ['listicle', 'review'],
    'entertainment': ['news', 'profile'],
    'relationships': ['analysis', 'listicle'],
    'travel': ['listicle', 'review'],
  };
  
  const secondary = categorySecondary[cat] || [];
  for (const t of secondary) {
    if (types.includes(t)) {
      console.log(`[Drafter] Category "${category}" -> Type "${t}" (secondary)`);
      return t;
    }
  }
  
  // Fallback to first available type
  const selected = types[Math.floor(Math.random() * types.length)];
  console.log(`[Drafter] Category "${category}" -> Type "${selected}" (fallback)`);
  return selected;
}

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
  recipes: [
    '1504674900247-0877df9cc836', '1556909114-f6e7ad7d3136', '1567620905732-2d1ec7ab7445',
    '1476224203421-9ac39bcb3327', '1540189549336-e6e99c3679fe'
  ],
  travel: [
    '1488085061387-422e29b40080', '1507525428034-b723cf961d3e', '1476514525535-07fb3b4ae5f1',
    '1530521954074-e64f6810b32d', '1469854523086-cc02fe5d8800'
  ],
  relationships: [
    '1516589178581-6cd7833ae3b2', '1529156069898-49953e39b3ac', '1511988617509-a57c8a288659',
    '1543807535-eceef0bc6599', '1522673607200-164d1b6ce486'
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

// Create a professional article from a gathered topic
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

  // Select the article type based on style and category
  const selectedType = selectArticleType(articleStyle, topic.category);
  console.log(`[Drafter] Creating ${selectedType} article for category: ${topic.category}`);
  
  // Create a modified style with the selected type for prompts
  const effectiveStyle: ArticleStyle = { ...articleStyle, types: [selectedType] };

  // Build dynamic system prompt based on article style
  const styleInstructions = getStyleInstructions(effectiveStyle, selectedType, language);
  const formatInstructions = getFormatInstructions(effectiveStyle, selectedType, language, randomImages);
  
  // Get current date for freshness context
  const now = new Date();
  const currentDate = now.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentYear = now.getFullYear();

  const systemPrompt = language === 'de'
    ? `Du bist ein erfahrener Content-Ersteller bei einer führenden Medienplattform.
       Du schreibst ${getArticleTypeLabel(selectedType, 'de')} in einem ${getToneLabel(articleStyle.tone, 'de')} Stil.
       
       AKTUELLES DATUM: ${currentDate} (${currentYear})
       
       DEIN PROFESSIONELLER STANDARD:
       ${styleInstructions}
       
       QUALITÄTSKRITERIEN:
       - Faktentreue und Genauigkeit haben höchste Priorität
       - Klare Struktur und gute Lesbarkeit
       - Lebendige, aber präzise Sprache
       - Kontext und Hintergrundinformationen liefern
       - Mehrwert für den Leser bieten
       - AKTUALITÄT: Schreibe so, als ob das Ereignis HEUTE oder GESTERN passiert ist
       - Verwende aktuelle Zeitreferenzen (heute, gestern, diese Woche, ${currentYear})`
    : `You are an experienced content creator at a leading media platform.
       You write ${getArticleTypeLabel(selectedType, 'en')} in a ${getToneLabel(articleStyle.tone, 'en')} style.
       
       CURRENT DATE: ${currentDate} (${currentYear})
       
       YOUR PROFESSIONAL STANDARDS:
       ${styleInstructions}
       
       QUALITY CRITERIA:
       - Factual accuracy is the highest priority
       - Clear structure and good readability
       - Vivid but precise language
       - Provide context and background information
       - Provide value to the reader
       - TIMELINESS: Write as if the event happened TODAY or YESTERDAY
       - Use current time references (today, yesterday, this week, ${currentYear})`;

  // Category-specific content guidelines
  const categoryGuidelines: Record<string, { de: string; en: string }> = {
    news: { de: 'Aktuelle Nachrichtenmeldungen und Ereignisse', en: 'Current news events and happenings' },
    technology: { de: 'Tech-Neuigkeiten, Gadgets, Software, Digitales', en: 'Tech news, gadgets, software, digital' },
    health: { de: 'Gesundheit, Medizin, Wellness, Fitness', en: 'Health, medicine, wellness, fitness' },
    finance: { de: 'Wirtschaft, Börse, Geld, Investments', en: 'Economy, stocks, money, investments' },
    sports: { de: 'Sport-Events, Teams, Athleten, Ergebnisse', en: 'Sports events, teams, athletes, results' },
    lifestyle: { de: 'Lifestyle, Mode, Trends, Wohnen', en: 'Lifestyle, fashion, trends, living' },
    entertainment: { de: 'Filme, Musik, Stars, Kultur', en: 'Movies, music, celebrities, culture' },
    recipes: { de: 'Rezepte, Kochen, Backen, Küchentipps', en: 'Recipes, cooking, baking, kitchen tips' },
    relationships: { de: 'Beziehungen, Dating, Familie', en: 'Relationships, dating, family' },
    travel: { de: 'Reisen, Urlaub, Destinations', en: 'Travel, vacation, destinations' },
  };
  
  const categoryGuide = categoryGuidelines[topic.category.toLowerCase()] || categoryGuidelines.news;

  const userPrompt = language === 'de'
    ? `AUFGABE: Schreibe ${getArticleTypeLabel(selectedType, 'de')} basierend auf folgenden Quellen.

ZIELKATEGORIE: ${topic.category.toUpperCase()}
KATEGORIE-FOKUS: ${categoryGuide.de}
WICHTIG: Der Artikel MUSS thematisch zur Kategorie "${topic.category}" passen!

QUELLINFORMATIONEN:
${sourcesText}

${formatInstructions}

KRITISCHE REGELN:
- Der Inhalt MUSS zur Kategorie "${topic.category}" passen - KEINE themenfremden Artikel!
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
    : `TASK: Write ${getArticleTypeLabel(selectedType, 'en')} based on the following sources.

TARGET CATEGORY: ${topic.category.toUpperCase()}
CATEGORY FOCUS: ${categoryGuide.en}
IMPORTANT: The article MUST thematically fit the "${topic.category}" category!

SOURCE INFORMATION:
${sourcesText}

${formatInstructions}

CRITICAL RULES:
- Content MUST fit the "${topic.category}" category - NO off-topic articles!
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
function getStyleInstructions(style: ArticleStyle, articleType: ArticleType, language: 'de' | 'en'): string {
  const instructions: Record<ArticleType, { de: string; en: string }> = {
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
    },
    guide: {
      de: `- Praktische Schritt-für-Schritt Anleitung
- Klare, nummerierte Schritte
- Tipps und Warnungen hervorheben
- Benötigte Materialien/Werkzeuge auflisten
- Erfolgskriterien definieren`,
      en: `- Practical step-by-step instructions
- Clear, numbered steps
- Highlight tips and warnings
- List required materials/tools
- Define success criteria`
    },
    recipe: {
      de: `- Zutatenliste mit genauen Mengen
- Klare Schritt-für-Schritt Kochanleitung
- Zubereitungs- und Kochzeit angeben
- Portionen/Personen angeben
- Tipps für Variationen und Alternativen`,
      en: `- Ingredient list with exact quantities
- Clear step-by-step cooking instructions
- Specify prep and cooking time
- Indicate servings/portions
- Tips for variations and alternatives`
    },
    review: {
      de: `- Ehrliche Bewertung mit Pro und Contra
- Konkrete Erfahrungen und Beispiele
- Vergleich mit Alternativen
- Klare Empfehlung oder Fazit
- Bewertung auf Skala (z.B. 1-10)`,
      en: `- Honest evaluation with pros and cons
- Concrete experiences and examples
- Comparison with alternatives
- Clear recommendation or conclusion
- Rating on scale (e.g., 1-10)`
    },
    listicle: {
      de: `- Klare nummerierte Liste
- Jeder Punkt mit kurzer Erklärung
- Von wichtigsten zu weniger wichtigen
- Einleitung und Fazit
- Leicht scannbar für Leser`,
      en: `- Clear numbered list
- Each point with brief explanation
- From most to least important
- Introduction and conclusion
- Easy to scan for readers`
    },
    profile: {
      de: `- Interessante Hintergrundinformationen
- Wichtige Meilensteine und Erfolge
- Persönliche Zitate und Einblicke
- Aktuelle Aktivitäten und Projekte
- Ausgewogene Darstellung`,
      en: `- Interesting background information
- Key milestones and achievements
- Personal quotes and insights
- Current activities and projects
- Balanced portrayal`
    }
  };
  
  return instructions[articleType][language];
}

// Get format instructions based on article type
function getFormatInstructions(style: ArticleStyle, articleType: ArticleType, language: 'de' | 'en', images: string[]): string {
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

  const quoteInstructions = style.includeQuotes && !['recipe', 'guide', 'listicle'].includes(articleType)
    ? language === 'de'
      ? '\n- Füge mindestens 1-2 Zitate ein (<blockquote>)'
      : '\n- Include at least 1-2 quotes (<blockquote>)'
    : '';

  const sourceInstructions = style.includeSources
    ? language === 'de'
      ? '\n- Quellenangaben im Text verarbeiten'
      : '\n- Process source citations in the text'
    : '';

  // Type-specific structure
  const structureTemplates: Record<ArticleType, { de: string; en: string }> = {
    news: {
      de: `STRUKTUR:
1. Einleitung - Das Wichtigste zusammenfassen
2. Hauptteil - Details und Kontext
3. Vertiefung - Analyse und Hintergründe
4. Ausblick/Fazit - Bedeutung und Perspektiven`,
      en: `STRUCTURE:
1. Introduction - Summarize the essentials
2. Main part - Details and context
3. Deep dive - Analysis and background
4. Outlook/Conclusion - Significance and perspectives`
    },
    analysis: {
      de: `STRUKTUR:
1. These - Hauptaussage präsentieren
2. Kontext - Hintergrundinformationen
3. Analyse - Daten und Fakten analysieren
4. Perspektiven - Verschiedene Sichtweisen
5. Fazit - Schlussfolgerungen`,
      en: `STRUCTURE:
1. Thesis - Present main argument
2. Context - Background information
3. Analysis - Analyze data and facts
4. Perspectives - Different viewpoints
5. Conclusion - Draw conclusions`
    },
    opinion: {
      de: `STRUKTUR:
1. Standpunkt - Position klar machen
2. Argumente - Belege und Beispiele
3. Gegenargumente - Ansprechen und entkräften
4. Fazit - Abschließende Empfehlung`,
      en: `STRUCTURE:
1. Position - Make stance clear
2. Arguments - Evidence and examples
3. Counterarguments - Address and refute
4. Conclusion - Final recommendation`
    },
    summary: {
      de: `STRUKTUR:
1. Überblick - Worum geht es
2. Kernpunkte - 5-7 wichtigste Fakten als Liste
3. Fazit - Was bedeutet das`,
      en: `STRUCTURE:
1. Overview - What it's about
2. Key points - 5-7 most important facts as list
3. Conclusion - What it means`
    },
    investigative: {
      de: `STRUKTUR:
1. Enthüllung - Was wurde aufgedeckt
2. Recherche - Wie wurde es entdeckt
3. Belege - Dokumente und Quellen
4. Bedeutung - Konsequenzen und Ausblick`,
      en: `STRUCTURE:
1. Revelation - What was uncovered
2. Investigation - How it was discovered
3. Evidence - Documents and sources
4. Significance - Consequences and outlook`
    },
    guide: {
      de: `STRUKTUR:
1. Einleitung - Was wird erreicht
2. Voraussetzungen - Was wird benötigt
3. Schritte - Nummerierte Anleitung (Schritt 1, Schritt 2, etc.)
4. Tipps - Zusätzliche Hinweise
5. Fazit - Erfolgskriterien`,
      en: `STRUCTURE:
1. Introduction - What will be achieved
2. Requirements - What is needed
3. Steps - Numbered instructions (Step 1, Step 2, etc.)
4. Tips - Additional advice
5. Conclusion - Success criteria`
    },
    recipe: {
      de: `STRUKTUR:
1. Einleitung - Kurze Beschreibung des Gerichts
2. Info-Box - Zeit, Portionen, Schwierigkeit
3. Zutaten - Liste mit Mengenangaben
4. Zubereitung - Nummerierte Schritte
5. Tipps - Variationen und Serviervorschläge`,
      en: `STRUCTURE:
1. Introduction - Brief description of the dish
2. Info box - Time, servings, difficulty
3. Ingredients - List with quantities
4. Instructions - Numbered steps
5. Tips - Variations and serving suggestions`
    },
    review: {
      de: `STRUKTUR:
1. Überblick - Was wird bewertet
2. Vorteile - Positive Aspekte
3. Nachteile - Negative Aspekte
4. Vergleich - Alternativen
5. Fazit - Bewertung und Empfehlung`,
      en: `STRUCTURE:
1. Overview - What is being reviewed
2. Pros - Positive aspects
3. Cons - Negative aspects
4. Comparison - Alternatives
5. Conclusion - Rating and recommendation`
    },
    listicle: {
      de: `STRUKTUR:
1. Einleitung - Warum diese Liste
2. Punkte 1-10 - Nummerierte Einträge mit Erklärung
3. Fazit - Zusammenfassung`,
      en: `STRUCTURE:
1. Introduction - Why this list
2. Points 1-10 - Numbered entries with explanation
3. Conclusion - Summary`
    },
    profile: {
      de: `STRUKTUR:
1. Einleitung - Wer ist die Person/Organisation
2. Hintergrund - Geschichte und Werdegang
3. Erfolge - Wichtige Meilensteine
4. Aktuelles - Gegenwärtige Aktivitäten
5. Ausblick - Zukunftspläne`,
      en: `STRUCTURE:
1. Introduction - Who is the person/organization
2. Background - History and journey
3. Achievements - Key milestones
4. Current - Present activities
5. Outlook - Future plans`
    }
  };

  const structure = structureTemplates[articleType] || structureTemplates.news;

  return language === 'de'
    ? `FORMATIERUNG (${wordCount} Wörter):
- Abschnitte mit <h2> Überschriften
- Kurze Absätze (2-3 Sätze) in <p> Tags
- Wichtige Begriffe mit <strong> hervorheben
- Listen mit <ul><li> oder <ol><li> wo sinnvoll${quoteInstructions}${sourceInstructions}${imageInstructions}

${structure.de}`
    : `FORMATTING (${wordCount} words):
- Sections with <h2> headings
- Short paragraphs (2-3 sentences) in <p> tags
- Highlight important terms with <strong>
- Use <ul><li> or <ol><li> for lists where appropriate${quoteInstructions}${sourceInstructions}${imageInstructions}

${structure.en}`;
}

// Get article type label
function getArticleTypeLabel(type: ArticleType, language: 'de' | 'en'): string {
  const labels: Record<ArticleType, { de: string; en: string }> = {
    news: { de: 'einen Nachrichtenartikel', en: 'a news article' },
    analysis: { de: 'eine Analyse', en: 'an analysis piece' },
    opinion: { de: 'einen Meinungsbeitrag', en: 'an opinion piece' },
    summary: { de: 'eine Zusammenfassung', en: 'a summary article' },
    investigative: { de: 'einen investigativen Bericht', en: 'an investigative report' },
    guide: { de: 'eine Schritt-für-Schritt Anleitung', en: 'a step-by-step guide' },
    recipe: { de: 'ein Rezept', en: 'a recipe' },
    review: { de: 'eine Bewertung/Review', en: 'a review' },
    listicle: { de: 'eine Top-Liste', en: 'a listicle' },
    profile: { de: 'ein Profil/Portrait', en: 'a profile piece' },
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
