import OpenAI from 'openai';
import { AgentResult, DraftArticle, EditedArticle } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Edit and improve draft articles
export async function editDrafts(
  drafts: DraftArticle[]
): Promise<AgentResult<EditedArticle[]>> {
  const startTime = Date.now();
  const editedArticles: EditedArticle[] = [];

  try {
    for (const draft of drafts) {
      try {
        const edited = await editDraft(draft);
        if (edited) {
          editedArticles.push(edited);
        }
      } catch (error) {
        console.error(`Error editing draft ${draft.id}:`, error);
      }
    }

    return {
      success: true,
      data: editedArticles,
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

// Edit a single draft article
async function editDraft(draft: DraftArticle): Promise<EditedArticle | null> {
  const systemPrompt = draft.language === 'de'
    ? `Du bist ein erfahrener Lektor und Redakteur. Deine Aufgabe ist es, Artikel zu verbessern:
       
       1. Korrigiere Grammatik- und Rechtschreibfehler
       2. Verbessere Stil und Lesbarkeit
       3. Stelle sicher, dass der Text flüssig und professionell klingt
       4. Überprüfe die Struktur und füge ggf. bessere Übergänge ein
       5. Optimiere Titel und Teaser für maximale Wirkung
       6. Bewerte die Qualität auf einer Skala von 1-10
       
       Behalte den Kern des Inhalts bei, verbessere aber die Präsentation.`
    : `You are an experienced editor. Your task is to improve articles:
       
       1. Correct grammar and spelling errors
       2. Improve style and readability
       3. Ensure the text sounds fluid and professional
       4. Check structure and add better transitions if needed
       5. Optimize title and teaser for maximum impact
       6. Rate the quality on a scale of 1-10
       
       Keep the core content but improve the presentation.`;

  const userPrompt = `Bitte überarbeite diesen Artikel:

Titel: ${draft.title}
Teaser: ${draft.teaser}
Inhalt:
${draft.content}
Tags: ${draft.tags.join(', ')}

Antworte im JSON-Format:
{
  "title": "verbesserter Titel",
  "teaser": "verbesserter Teaser",
  "content": "verbesserter Inhalt mit HTML",
  "tags": ["verbesserte", "tags"],
  "editNotes": "Kurze Beschreibung der Änderungen",
  "qualityScore": 8
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 2500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const editedData = JSON.parse(jsonMatch[0]);

    return {
      ...draft,
      title: editedData.title || draft.title,
      teaser: editedData.teaser || draft.teaser,
      content: editedData.content || draft.content,
      tags: editedData.tags || draft.tags,
      editedAt: new Date(),
      editNotes: editedData.editNotes || 'No significant changes needed',
      qualityScore: editedData.qualityScore || 7,
    };
  } catch (error) {
    console.error('Error in editDraft:', error);
    
    // Return original draft with minimal editing
    return {
      ...draft,
      editedAt: new Date(),
      editNotes: 'Auto-approved without AI editing due to error',
      qualityScore: 6,
    };
  }
}

export { editDraft };
