import { Inter } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getServerBrandConfig } from '@/lib/brand/server';
import { BrandContext } from '@/lib/brand/context';
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content={brandConfig.primaryColor} />
        <link rel="icon" href="/favicon.ico" />
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --brand-primary: ${brandConfig.primaryColor};
              --brand-secondary: ${brandConfig.secondaryColor};
            }
          `
        }} />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-background`}>
        <NextIntlClientProvider messages={messages}>
          <BrandContext.Provider value={brandConfig}>
            {children}
          </BrandContext.Provider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
