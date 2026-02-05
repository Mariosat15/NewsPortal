import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getServerBrandConfig } from '@/lib/brand/server';
import { BrandProvider } from '@/lib/brand/provider';
import { AppLayout } from '@/components/layout/app-layout';
import { MsisdnDetector } from '@/components/tracking/msisdn-detector';

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

  // Get messages for the locale
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <BrandProvider config={brandConfig}>
        {/* Global MSISDN detection - works on all pages */}
        <MsisdnDetector 
          autoDetect={true} 
          debug={process.env.NODE_ENV === 'development'}
        />
        <AppLayout>
          {children}
        </AppLayout>
      </BrandProvider>
    </NextIntlClientProvider>
  );
}
