import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getServerBrandConfig } from '@/lib/brand/server';
import { BrandProvider } from '@/lib/brand/provider';
import { AppLayout } from '@/components/layout/app-layout';
import { MsisdnDetector } from '@/components/tracking/msisdn-detector';
import { getNewTemplateSettings, isNewTemplate } from '@/lib/settings/get-template';

// Force dynamic rendering to always fetch fresh template settings
export const dynamic = 'force-dynamic';

// Supported locales
const locales = ['de', 'en'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const brandConfig = await getServerBrandConfig();
  
  return {
    title: {
      default: brandConfig.name,
      template: `%s | ${brandConfig.name}`,
    },
    description: locale === 'de' 
      ? 'Premium Nachrichtenartikel - Zahlen Sie nur für das, was Sie lesen'
      : 'Premium news articles - Pay only for what you read',
    keywords: locale === 'de'
      ? ['Nachrichten', 'News', 'Artikel', 'Deutschland']
      : ['News', 'Articles', 'Germany'],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate locale
  if (!locales.includes(locale)) {
    notFound();
  }

  // Get brand config
  const brandConfig = await getServerBrandConfig();
  console.log('[Layout] Brand logoUrl:', brandConfig.logoUrl);

  // Get messages for the locale
  const messages = await getMessages();

  // Check if using new template system
  const templateSettings = await getNewTemplateSettings();
  const useNewTemplateSystem = isNewTemplate(templateSettings.templateId);

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <BrandProvider config={brandConfig}>
        {/* Global MSISDN detection - works on all pages */}
        <MsisdnDetector 
          autoDetect={true} 
          debug={process.env.NODE_ENV === 'development'}
        />
        <AppLayout useNewTemplateSystem={useNewTemplateSystem}>
          {children}
        </AppLayout>
      </BrandProvider>
    </NextIntlClientProvider>
  );
}
