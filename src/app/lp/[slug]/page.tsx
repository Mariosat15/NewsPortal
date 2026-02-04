import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getLandingPageRepository, getArticleRepository } from '@/lib/db';
import { getBrandId } from '@/lib/brand/server';
import { LandingPageTracker } from './tracker';
import { LeadGen1Layout } from '@/components/landing/layouts/lead-gen-1';
import { LeadGen2Layout } from '@/components/landing/layouts/lead-gen-2';
import { LeadGen3Layout } from '@/components/landing/layouts/lead-gen-3';
import { LeadGen4Layout } from '@/components/landing/layouts/lead-gen-4';
import { LeadGen5Layout } from '@/components/landing/layouts/lead-gen-5';
import { LandingPageLocale, getTranslatedText } from '@/lib/db/models/landing-page';
import { Metadata } from 'next';

// Helper to get dynamic base URL from request headers
async function getDynamicBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

// Force dynamic rendering - landing pages must be dynamic for multi-tenant support
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const queryParams = await searchParams;
  const locale = ((queryParams.locale as string) || 'de') as LandingPageLocale;
  
  // Get dynamic base URL for canonical links
  const baseUrl = await getDynamicBaseUrl();
  const canonicalUrl = `${baseUrl}/lp/${slug}${locale !== 'de' ? `?locale=${locale}` : ''}`;
  
  try {
    const brandId = await getBrandId();
    const lpRepo = getLandingPageRepository(brandId);
    const page = await lpRepo.findPublishedBySlug(slug);

    if (page) {
      const title = getTranslatedText(
        page.config.heroTitleTranslations,
        page.config.heroTitle,
        locale
      ) || page.name;
      
      const description = getTranslatedText(
        page.config.heroSubtitleTranslations,
        page.config.heroSubtitle,
        locale
      );

      return {
        title,
        description,
        robots: 'index, follow',
        alternates: {
          canonical: canonicalUrl,
        },
        openGraph: {
          title,
          description,
          url: canonicalUrl,
          type: 'website',
        },
      };
    }
  } catch (error) {
    console.error('[Landing Page] Metadata error:', error);
  }

  return {
    title: 'Landing Page',
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function LandingPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const queryParams = await searchParams;
  
  console.log('[Landing Page] Requested slug:', slug);
  
  let brandId: string;
  let page;
  let articles: Array<{
    slug: string;
    title: string;
    teaser: string;
    thumbnail: string;
    category: string;
  }> = [];

  try {
    brandId = await getBrandId();
    console.log('[Landing Page] Brand ID:', brandId);
    
    const lpRepo = getLandingPageRepository(brandId);
    
    // Debug: List all landing pages first
    const allPages = await lpRepo.list({ tenantId: brandId });
    console.log('[Landing Page] All pages in DB:', allPages.pages.map(p => ({ slug: p.slug, status: p.status, tenantId: p.tenantId })));
    
    page = await lpRepo.findPublishedBySlug(slug);
    
    console.log('[Landing Page] Found page:', page ? { slug: page.slug, status: page.status, layout: page.layout } : 'null');
  } catch (error) {
    console.error('[Landing Page] Error fetching page:', error);
    notFound();
  }

  if (!page) {
    console.log('[Landing Page] Page not found for slug:', slug);
    notFound();
  }

  // Fetch articles
  try {
    const articleRepo = getArticleRepository(brandId);
    const result = await articleRepo.listPublished({ page: 1, limit: 30 });
    articles = result.articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      teaser: a.teaser,
      thumbnail: a.thumbnail,
      category: a.category,
    }));
  } catch (error) {
    console.error('[Landing Page] Error fetching articles:', error);
  }

  // Get locale from query or default (validate it's a supported locale)
  const rawLocale = (queryParams.locale as string) || 'de';
  const locale: LandingPageLocale = (rawLocale === 'en' || rawLocale === 'de') ? rawLocale : 'de';

  // Extract UTM params
  const utm = {
    source: (queryParams.utm_source as string) || page.trackingDefaults.utmSource,
    medium: (queryParams.utm_medium as string) || page.trackingDefaults.utmMedium,
    campaign: (queryParams.utm_campaign as string) || page.trackingDefaults.utmCampaign,
    content: queryParams.utm_content as string,
    term: queryParams.utm_term as string,
  };

  // Render appropriate layout
  const layoutComponents = {
    'lead-gen-1': LeadGen1Layout,
    'lead-gen-2': LeadGen2Layout,
    'lead-gen-3': LeadGen3Layout,
    'lead-gen-4': LeadGen4Layout,
    'lead-gen-5': LeadGen5Layout,
  };

  const LayoutComponent = layoutComponents[page.layout] || LeadGen1Layout;

  return (
    <>
      {/* Tracking Script */}
      <LandingPageTracker
        landingPageSlug={page.slug}
        landingPageId={page._id?.toString()}
        utm={utm}
      />

      {/* Landing Page Content */}
      <LayoutComponent
        config={page.config}
        articles={articles}
        locale={locale}
        slug={slug}
      />
    </>
  );
}
