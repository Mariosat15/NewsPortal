import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getServerBrandConfig } from '@/lib/brand';

const legalPages = ['hilfe', 'kundenportal', 'widerrufsbelehrung', 'impressum', 'kuendigung', 'agb', 'datenschutz'];

export async function generateStaticParams() {
  return legalPages.map((page) => ({ page }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { page } = await params;
  const t = await getTranslations('legal');
  const brand = await getServerBrandConfig();

  if (!legalPages.includes(page)) {
    return {};
  }

  return {
    title: t(`${page}Title` as keyof IntlMessages),
    description: `${t(`${page}Title` as keyof IntlMessages)} - ${brand.name}`,
  };
}

// Legal page content (placeholder - should be configured per brand)
function getLegalContent(page: string, locale: string, brand: { name: string; impressum: { companyName: string; address: string; email: string; phone?: string; vatId?: string; registerNumber?: string } }) {
  const contents: Record<string, Record<string, string>> = {
    hilfe: {
      de: `
        <h1>Hilfe & Support</h1>
        <p>Haben Sie Fragen oder benötigen Sie Unterstützung? Wir helfen Ihnen gerne weiter.</p>
        <h2>Kontakt</h2>
        <p>E-Mail: ${brand.impressum.email}</p>
        ${brand.impressum.phone ? `<p>Telefon: ${brand.impressum.phone}</p>` : ''}
        <h2>Häufig gestellte Fragen</h2>
        <h3>Wie funktioniert die Bezahlung?</h3>
        <p>Die Bezahlung erfolgt bequem über Ihre Handyrechnung. Klicken Sie einfach auf "Artikel entsperren" und folgen Sie den Anweisungen.</p>
        <h3>Kann ich mein Geld zurückbekommen?</h3>
        <p>Ja, Sie haben ein 14-tägiges Widerrufsrecht. Weitere Informationen finden Sie in unserer Widerrufsbelehrung.</p>
      `,
      en: `
        <h1>Help & Support</h1>
        <p>Do you have questions or need support? We are happy to help.</p>
        <h2>Contact</h2>
        <p>Email: ${brand.impressum.email}</p>
        ${brand.impressum.phone ? `<p>Phone: ${brand.impressum.phone}</p>` : ''}
        <h2>Frequently Asked Questions</h2>
        <h3>How does the payment work?</h3>
        <p>Payment is conveniently made through your mobile phone bill. Simply click "Unlock article" and follow the instructions.</p>
        <h3>Can I get my money back?</h3>
        <p>Yes, you have a 14-day right of withdrawal. More information can be found in our cancellation policy.</p>
      `,
    },
    impressum: {
      de: `
        <h1>Impressum</h1>
        <h2>Angaben gemäß § 5 TMG</h2>
        <p><strong>${brand.impressum.companyName}</strong></p>
        <p>${brand.impressum.address}</p>
        <h2>Kontakt</h2>
        <p>E-Mail: ${brand.impressum.email}</p>
        ${brand.impressum.phone ? `<p>Telefon: ${brand.impressum.phone}</p>` : ''}
        ${brand.impressum.vatId ? `<h2>Umsatzsteuer-ID</h2><p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: ${brand.impressum.vatId}</p>` : ''}
        ${brand.impressum.registerNumber ? `<h2>Handelsregister</h2><p>${brand.impressum.registerNumber}</p>` : ''}
      `,
      en: `
        <h1>Legal Notice</h1>
        <h2>Information according to § 5 TMG</h2>
        <p><strong>${brand.impressum.companyName}</strong></p>
        <p>${brand.impressum.address}</p>
        <h2>Contact</h2>
        <p>Email: ${brand.impressum.email}</p>
        ${brand.impressum.phone ? `<p>Phone: ${brand.impressum.phone}</p>` : ''}
        ${brand.impressum.vatId ? `<h2>VAT ID</h2><p>VAT identification number: ${brand.impressum.vatId}</p>` : ''}
        ${brand.impressum.registerNumber ? `<h2>Trade Register</h2><p>${brand.impressum.registerNumber}</p>` : ''}
      `,
    },
    datenschutz: {
      de: `
        <h1>Datenschutzerklärung</h1>
        <h2>1. Verantwortlicher</h2>
        <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
        <p>${brand.impressum.companyName}<br>${brand.impressum.address}<br>E-Mail: ${brand.impressum.email}</p>
        <h2>2. Erhebung und Speicherung personenbezogener Daten</h2>
        <p>Beim Besuch unserer Website werden automatisch Informationen gespeichert, die Ihr Browser an uns übermittelt (Server-Logfiles).</p>
        <h2>3. Zahlungsdaten</h2>
        <p>Bei der Bezahlung über DIMOCO werden Ihre Mobilfunknummer und Zahlungsinformationen verarbeitet. Weitere Informationen finden Sie in den Datenschutzbestimmungen von DIMOCO.</p>
        <h2>4. Ihre Rechte</h2>
        <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer personenbezogenen Daten.</p>
      `,
      en: `
        <h1>Privacy Policy</h1>
        <h2>1. Controller</h2>
        <p>The controller responsible for data processing on this website is:</p>
        <p>${brand.impressum.companyName}<br>${brand.impressum.address}<br>Email: ${brand.impressum.email}</p>
        <h2>2. Collection and Storage of Personal Data</h2>
        <p>When you visit our website, information is automatically stored that your browser transmits to us (server log files).</p>
        <h2>3. Payment Data</h2>
        <p>When paying via DIMOCO, your mobile phone number and payment information are processed. More information can be found in DIMOCO's privacy policy.</p>
        <h2>4. Your Rights</h2>
        <p>You have the right to access, rectification, deletion, and restriction of processing of your personal data.</p>
      `,
    },
    agb: {
      de: `
        <h1>Allgemeine Geschäftsbedingungen</h1>
        <h2>§ 1 Geltungsbereich</h2>
        <p>Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen ${brand.impressum.companyName} und dem Nutzer über den Erwerb von kostenpflichtigen Artikeln.</p>
        <h2>§ 2 Vertragsschluss</h2>
        <p>Der Vertrag kommt durch Klicken auf den Button "Artikel entsperren" und Bestätigung der Zahlung zustande.</p>
        <h2>§ 3 Preise</h2>
        <p>Die angegebenen Preise sind Endpreise und enthalten die gesetzliche Mehrwertsteuer.</p>
        <h2>§ 4 Zahlung</h2>
        <p>Die Zahlung erfolgt über Ihre Mobilfunkrechnung (DIMOCO pay:smart).</p>
      `,
      en: `
        <h1>Terms and Conditions</h1>
        <h2>§ 1 Scope</h2>
        <p>These Terms and Conditions apply to all contracts between ${brand.impressum.companyName} and the user for the purchase of paid articles.</p>
        <h2>§ 2 Conclusion of Contract</h2>
        <p>The contract is concluded by clicking the "Unlock article" button and confirming the payment.</p>
        <h2>§ 3 Prices</h2>
        <p>The prices shown are final prices and include the statutory VAT.</p>
        <h2>§ 4 Payment</h2>
        <p>Payment is made via your mobile phone bill (DIMOCO pay:smart).</p>
      `,
    },
    widerrufsbelehrung: {
      de: `
        <h1>Widerrufsbelehrung</h1>
        <h2>Widerrufsrecht</h2>
        <p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p>
        <p>Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p>
        <h2>Folgen des Widerrufs</h2>
        <p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen zurückzuzahlen.</p>
      `,
      en: `
        <h1>Cancellation Policy</h1>
        <h2>Right of Withdrawal</h2>
        <p>You have the right to cancel this contract within fourteen days without giving any reason.</p>
        <p>The cancellation period is fourteen days from the day of the conclusion of the contract.</p>
        <h2>Consequences of Cancellation</h2>
        <p>If you cancel this contract, we will refund all payments we have received from you immediately and at the latest within fourteen days.</p>
      `,
    },
    kuendigung: {
      de: `
        <h1>Kündigung</h1>
        <p>Da es sich bei unseren Artikeln um Einzelkäufe handelt, ist keine Kündigung eines Abonnements erforderlich.</p>
        <p>Bei Fragen zu Ihren Käufen kontaktieren Sie uns bitte unter: ${brand.impressum.email}</p>
      `,
      en: `
        <h1>Termination</h1>
        <p>Since our articles are individual purchases, no subscription cancellation is required.</p>
        <p>For questions about your purchases, please contact us at: ${brand.impressum.email}</p>
      `,
    },
    kundenportal: {
      de: `
        <h1>Kundenportal</h1>
        <p>Um Ihre gekauften Artikel einzusehen oder Ihren Kaufverlauf zu prüfen, benötigen wir Ihre Handynummer.</p>
        <p>Für Support-Anfragen kontaktieren Sie uns bitte unter: ${brand.impressum.email}</p>
      `,
      en: `
        <h1>Customer Portal</h1>
        <p>To view your purchased articles or check your purchase history, we need your mobile number.</p>
        <p>For support inquiries, please contact us at: ${brand.impressum.email}</p>
      `,
    },
  };

  return contents[page]?.[locale] || contents[page]?.de || '<p>Content not available</p>';
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { locale, page } = await params;
  
  if (!legalPages.includes(page)) {
    notFound();
  }

  const t = await getTranslations('legal');
  const brand = await getServerBrandConfig();
  const content = getLegalContent(page, locale, brand);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container px-4 py-8 max-w-3xl mx-auto">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
