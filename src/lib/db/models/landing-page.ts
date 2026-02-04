import { ObjectId } from 'mongodb';

// Supported languages for landing pages
export type LandingPageLocale = 'en' | 'de';

// Translatable text structure
export interface TranslatableText {
  en: string;
  de: string;
}

export interface BannerConfig {
  id: string;
  image: string;
  link: string;
  position: 'top' | 'middle' | 'bottom' | 'sidebar';
  altText?: string;
}

export interface CategoryBlockConfig {
  category: string;
  count: number;
  showImages?: boolean;
  title?: TranslatableText;
}

export interface CtaButtonConfig {
  id: string;
  text: string;
  textTranslations?: TranslatableText;
  link: string;
  color: string;
  position?: 'hero' | 'middle' | 'bottom';
}

export interface LandingPageConfig {
  heroImage?: string;
  heroTitle?: string;
  heroTitleTranslations?: TranslatableText;
  heroSubtitle?: string;
  heroSubtitleTranslations?: TranslatableText;
  heroVideoUrl?: string;
  banners: BannerConfig[];
  categoryBlocks: CategoryBlockConfig[];
  ctaButtons: CtaButtonConfig[];
  showNewsTicker?: boolean;
  showSidebar?: boolean;
  customCss?: string;
  // Section titles
  sectionTitles?: {
    popularArticles?: TranslatableText;
    moreArticles?: TranslatableText;
    latestNews?: TranslatableText;
    featuredStories?: TranslatableText;
    discoverMore?: TranslatableText;
    stayInformed?: TranslatableText;
  };
}

// Helper function to get translated text
export function getTranslatedText(
  translations: TranslatableText | undefined,
  fallback: string | undefined,
  locale: LandingPageLocale
): string {
  if (translations && translations[locale]) {
    return translations[locale];
  }
  return fallback || '';
}

export interface TrackingDefaults {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

export type LandingPageLayout = 
  | 'lead-gen-1'  // Hero banner + category grid + CTA
  | 'lead-gen-2'  // Full-width hero + article cards + sidebar
  | 'lead-gen-3'  // Video hero + featured articles + newsletter CTA
  | 'lead-gen-4'  // Carousel hero + news ticker + category sections
  | 'lead-gen-5'; // Magazine style with multiple sections

export type LandingPageStatus = 'draft' | 'published';

export interface LandingPage {
  _id?: ObjectId;
  tenantId: string;
  slug: string;
  name: string;
  layout: LandingPageLayout;
  config: LandingPageConfig;
  trackingDefaults: TrackingDefaults;
  status: LandingPageStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface LandingPageCreateInput {
  tenantId: string;
  slug: string;
  name: string;
  layout: LandingPageLayout;
  config: LandingPageConfig;
  trackingDefaults?: TrackingDefaults;
  status?: LandingPageStatus;
}

export interface LandingPageUpdateInput {
  slug?: string;
  name?: string;
  layout?: LandingPageLayout;
  config?: Partial<LandingPageConfig>;
  trackingDefaults?: Partial<TrackingDefaults>;
  status?: LandingPageStatus;
}
