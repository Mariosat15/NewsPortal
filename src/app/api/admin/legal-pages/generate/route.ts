import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin';
import { getBrandConfig } from '@/lib/brand/server';
import OpenAI from 'openai';

// POST /api/admin/legal-pages/generate - Generate legal content with AI
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageType, language, customInstructions } = body;

    if (!pageType) {
      return NextResponse.json(
        { error: 'Missing required field: pageType' },
        { status: 400 }
      );
    }

    // Get brand config for company info
    const brand = await getBrandConfig();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Build prompt based on page type
    const prompts = getPromptForPageType(pageType, brand, language || 'de', customInstructions);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a legal content expert who creates professional, compliant legal documents for websites. 
Generate content in HTML format using tags like <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>.
Be thorough but concise. The content should be legally sound but accessible to regular users.
Use proper legal terminology for ${language === 'en' ? 'English' : 'German'} law.
Do not include any markdown - only valid HTML tags.`,
        },
        {
          role: 'user',
          content: prompts.prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const content = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      data: {
        content,
        title: prompts.title,
        pageType,
        language,
      },
    });
  } catch (error) {
    console.error('Error generating legal content:', error);
    return NextResponse.json(
      { error: 'Failed to generate legal content' },
      { status: 500 }
    );
  }
}

interface BrandConfig {
  name: string;
  impressum: {
    companyName: string;
    address: string;
    email: string;
    phone?: string;
    vatId?: string;
    registerNumber?: string;
  };
}

function getPromptForPageType(
  pageType: string,
  brand: BrandConfig,
  language: string,
  customInstructions?: string
): { prompt: string; title: { de: string; en: string } } {
  const companyInfo = `
Company: ${brand.impressum.companyName}
Address: ${brand.impressum.address}
Email: ${brand.impressum.email}
${brand.impressum.phone ? `Phone: ${brand.impressum.phone}` : ''}
${brand.impressum.vatId ? `VAT ID: ${brand.impressum.vatId}` : ''}
Website: ${brand.name}
`;

  const lang = language === 'en' ? 'English' : 'German';
  const customNote = customInstructions ? `\n\nAdditional instructions: ${customInstructions}` : '';

  const prompts: Record<string, { prompt: string; title: { de: string; en: string } }> = {
    impressum: {
      title: { de: 'Impressum', en: 'Legal Notice' },
      prompt: `Generate a complete ${lang} Impressum (Legal Notice) for a website. This should comply with German TMG § 5 requirements.

${companyInfo}

Include sections for:
- Company information
- Contact details
- Responsible person
- Trade register info (if applicable)
- VAT ID (if applicable)
- Professional regulations (if applicable)
- Dispute resolution${customNote}`,
    },
    datenschutz: {
      title: { de: 'Datenschutzerklärung', en: 'Privacy Policy' },
      prompt: `Generate a comprehensive ${lang} Privacy Policy (Datenschutzerklärung) compliant with GDPR/DSGVO.

${companyInfo}

The website:
- Uses cookies for session management
- Processes payments via DIMOCO (mobile carrier billing)
- Collects phone numbers for payment
- May use analytics

Include sections for:
- Controller information
- Types of data collected
- Purpose of data processing
- Legal basis (GDPR Art. 6)
- Data retention periods
- Third-party services (payment providers)
- User rights (access, deletion, portability, etc.)
- Cookies and tracking
- Contact for data protection inquiries${customNote}`,
    },
    agb: {
      title: { de: 'Allgemeine Geschäftsbedingungen', en: 'Terms and Conditions' },
      prompt: `Generate comprehensive ${lang} Terms and Conditions (AGB) for a digital content/article selling website.

${companyInfo}

Business model:
- Users can purchase individual articles
- Payment via mobile phone billing (DIMOCO)
- Digital content is delivered immediately after payment
- No subscription model - individual purchases only

Include sections for:
- Scope and definitions
- Contract formation
- Prices and payment
- Delivery of digital content
- Right of withdrawal
- Liability limitations
- Warranty
- Intellectual property
- Governing law and jurisdiction${customNote}`,
    },
    widerrufsbelehrung: {
      title: { de: 'Widerrufsbelehrung', en: 'Cancellation Policy' },
      prompt: `Generate a ${lang} Cancellation Policy (Widerrufsbelehrung) compliant with German/EU consumer protection law.

${companyInfo}

Note: We sell digital content (articles) that are delivered immediately. Include information about:
- 14-day right of withdrawal
- How to exercise the right
- Consequences of withdrawal
- Exception for digital content with consumer consent
- Model cancellation form${customNote}`,
    },
    hilfe: {
      title: { de: 'Hilfe & FAQ', en: 'Help & FAQ' },
      prompt: `Generate a helpful ${lang} Help/FAQ page for a digital content website.

${companyInfo}

The website sells individual articles that are unlocked via mobile phone billing.

Include FAQs about:
- How to purchase/unlock articles
- Payment methods and process
- How to get a refund
- Account and purchase history
- Technical issues
- Contact information${customNote}`,
    },
    risk_disclaimer: {
      title: { de: 'Risikohinweis', en: 'Risk Disclaimer' },
      prompt: `Generate a short ${lang} risk disclaimer suitable for display in the footer of a news/content website.

${companyInfo}

The disclaimer should:
- Be concise (2-3 sentences)
- Mention that content is for informational purposes only
- State that the website is not responsible for decisions made based on the content
- Be professional but not alarming

Just provide the disclaimer text, no HTML headings needed.${customNote}`,
    },
  };

  return prompts[pageType] || {
    title: { de: 'Rechtliches', en: 'Legal' },
    prompt: `Generate a ${lang} legal page about: ${pageType}\n\n${companyInfo}${customNote}`,
  };
}
