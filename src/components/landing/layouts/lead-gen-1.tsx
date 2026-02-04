'use client';

/**
 * Lead Gen Layout 1: Hero banner + category grid + CTA
 * Clean and focused layout for high-conversion campaigns
 */

import { HeroBanner } from '../sections/hero-banner';
import { CategoryGrid } from '../sections/category-grid';
import { CtaSection } from '../sections/cta-section';
import { LanguageSwitcher } from '../language-switcher';
import { LandingPageConfig, LandingPageLocale, getTranslatedText } from '@/lib/db/models/landing-page';

interface Article {
  slug: string;
  title: string;
  teaser: string;
  thumbnail: string;
  category: string;
}

interface LeadGen1Props {
  config: LandingPageConfig;
  articles: Article[];
  locale: LandingPageLocale;
  slug: string;
}

// Default translations
const defaultTranslations = {
  popularArticles: { en: 'Popular Articles', de: 'Beliebte Artikel' },
  moreArticles: { en: 'More Articles', de: 'Weitere Artikel' },
  discoverMore: { en: 'Discover More', de: 'Entdecken Sie mehr' },
  diveInto: { en: 'Dive into our world of news', de: 'Tauchen Sie ein in unsere Welt der Nachrichten' },
  startReading: { en: 'Start Reading', de: 'Jetzt lesen' },
  stayInformed: { en: 'Stay Informed', de: 'Bleiben Sie informiert' },
  allArticles: { en: 'All Articles', de: 'Alle Artikel' },
};

export function LeadGen1Layout({ config, articles, locale, slug }: LeadGen1Props) {
  // Get translated texts
  const heroTitle = getTranslatedText(config.heroTitleTranslations, config.heroTitle, locale);
  const heroSubtitle = getTranslatedText(config.heroSubtitleTranslations, config.heroSubtitle, locale);
  
  const popularTitle = getTranslatedText(
    config.sectionTitles?.popularArticles,
    defaultTranslations.popularArticles[locale],
    locale
  );
  
  const moreTitle = getTranslatedText(
    config.sectionTitles?.moreArticles,
    defaultTranslations.moreArticles[locale],
    locale
  );

  // Get CTA button text with translations
  const getCtaText = (button: { text: string; textTranslations?: { en: string; de: string } }) => {
    return getTranslatedText(button.textTranslations, button.text, locale);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Language Switcher - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher currentLocale={locale} slug={slug} variant="dropdown" />
      </div>

      {/* Hero Section */}
      <HeroBanner
        image={config.heroImage}
        title={heroTitle}
        subtitle={heroSubtitle}
        ctaText={config.ctaButtons?.[0] ? getCtaText(config.ctaButtons[0]) : defaultTranslations.startReading[locale]}
        ctaLink={config.ctaButtons?.[0]?.link || '/'}
        height="large"
        textAlign="center"
      />

      {/* Featured Articles Grid */}
      <CategoryGrid
        title={popularTitle}
        articles={articles.slice(0, 6)}
        columns={3}
        showCategory={true}
        locale={locale}
      />

      {/* CTA Section */}
      <CtaSection
        title={getTranslatedText(config.sectionTitles?.discoverMore, defaultTranslations.discoverMore[locale], locale)}
        subtitle={defaultTranslations.diveInto[locale]}
        buttons={config.ctaButtons?.length ? config.ctaButtons.map(btn => ({
          ...btn,
          text: getCtaText(btn),
        })) : [
          { id: 'main-cta', text: defaultTranslations.startReading[locale], link: `/${locale}`, color: '#e91e8c' },
        ]}
        background="gradient"
      />

      {/* More Articles */}
      {articles.length > 6 && (
        <CategoryGrid
          title={moreTitle}
          articles={articles.slice(6, 12)}
          columns={4}
          showCategory={true}
          locale={locale}
        />
      )}

      {/* Footer CTA */}
      <CtaSection
        title={getTranslatedText(config.sectionTitles?.stayInformed, defaultTranslations.stayInformed[locale], locale)}
        buttons={[
          { id: 'footer-cta', text: defaultTranslations.allArticles[locale], link: `/${locale}`, color: '#374151' },
        ]}
        background="dark"
      />
    </div>
  );
}
