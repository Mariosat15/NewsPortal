import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getServerBrandConfig } from '@/lib/brand/server';
import { BrandProvider } from '@/lib/brand/provider';
import { AppLayout } from '@/components/layout/app-layout';

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

// Get current user from session
async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user_session')?.value;
    if (userCookie) {
      const userData = JSON.parse(userCookie);
      return userData;
    }
  } catch {
    // No user session
  }
  return null;
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

  // Get current user
  const user = await getCurrentUser();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <BrandProvider config={brandConfig}>
        <AppLayout user={user}>
          {children}
        </AppLayout>
      </BrandProvider>
    </NextIntlClientProvider>
  );
}
