'use client';

/**
 * Lead Gen Layout 2: Full-width hero + article cards + sidebar
 * Magazine-style layout with featured content emphasis
 */

import Image from 'next/image';
import { HeroBanner } from '../sections/hero-banner';
import { BannerStrip } from '../sections/banner-strip';
import { LanguageSwitcher } from '../language-switcher';
import { trackLinkClick, navigateToPortal } from '@/lib/tracking/tracker';
import { LandingPageConfig, LandingPageLocale, getTranslatedText } from '@/lib/db/models/landing-page';

interface Article {
  slug: string;
  title: string;
  teaser: string;
  thumbnail: string;
  category: string;
}

interface LeadGen2Props {
  config: LandingPageConfig;
  articles: Article[];
  locale: LandingPageLocale;
  slug: string;
}

// Default translations
const defaultTranslations = {
  latestArticles: { en: 'Latest Articles', de: 'Neueste Artikel' },
  popular: { en: 'Popular', de: 'Beliebt' },
  viewAll: { en: 'View All', de: 'Alle Artikel' },
};

export function LeadGen2Layout({ config, articles, locale, slug }: LeadGen2Props) {
  const featuredArticle = articles[0];
  const sideArticles = articles.slice(1, 4);
  const mainArticles = articles.slice(4, 10);
  const sidebarArticles = articles.slice(10, 15);

  const handleArticleClick = (article: Article) => {
    const url = `/${locale}/article/${article.slug}`;
    trackLinkClick(url, article.slug, article.title);
    navigateToPortal(url);
  };

  // Get translated texts
  const heroTitle = getTranslatedText(config.heroTitleTranslations, config.heroTitle, locale) || featuredArticle?.title;
  const heroSubtitle = getTranslatedText(config.heroSubtitleTranslations, config.heroSubtitle, locale) || featuredArticle?.teaser;
  const ctaText = config.ctaButtons?.[0]?.textTranslations 
    ? getTranslatedText(config.ctaButtons[0].textTranslations, config.ctaButtons[0].text, locale)
    : config.ctaButtons?.[0]?.text;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher currentLocale={locale} slug={slug} variant="dropdown" />
      </div>

      {/* Hero */}
      <HeroBanner
        image={config.heroImage || featuredArticle?.thumbnail}
        title={heroTitle}
        subtitle={heroSubtitle}
        ctaText={ctaText}
        ctaLink={config.ctaButtons?.[0]?.link}
        height="medium"
      />

      {/* Banner Strip */}
      {config.banners && config.banners.length > 0 && (
        <BannerStrip banners={config.banners} layout="triple" height="small" />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column */}
          <main className="lg:col-span-8">
            {/* Featured Article */}
            {featuredArticle && (
              <article
                onClick={() => handleArticleClick(featuredArticle)}
                className="cursor-pointer group mb-8"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                  <Image
                    src={featuredArticle.thumbnail}
                    alt={featuredArticle.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="px-3 py-1 bg-pink-600 text-white text-xs font-bold uppercase rounded">
                      {featuredArticle.category}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mt-3 group-hover:text-pink-200 transition-colors">
                      {featuredArticle.title}
                    </h2>
                  </div>
                </div>
              </article>
            )}

            {/* Side Articles Row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {sideArticles.map((article) => (
                <article
                  key={article.slug}
                  onClick={() => handleArticleClick(article)}
                  className="cursor-pointer group"
                >
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-2">
                    <Image
                      src={article.thumbnail}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-pink-600 transition-colors">
                    {article.title}
                  </h3>
                </article>
              ))}
            </div>

            {/* Main Articles List */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 border-b pb-2">
                {getTranslatedText(config.sectionTitles?.latestNews, defaultTranslations.latestArticles[locale], locale)}
              </h3>
              {mainArticles.map((article) => (
                <article
                  key={article.slug}
                  onClick={() => handleArticleClick(article)}
                  className="flex gap-4 cursor-pointer group"
                >
                  <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={article.thumbnail}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-pink-600 uppercase">
                      {article.category}
                    </span>
                    <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-pink-600 transition-colors">
                      {article.title}
                    </h4>
                    <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                      {article.teaser}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                {defaultTranslations.popular[locale]}
              </h3>
              <div className="space-y-4">
                {sidebarArticles.map((article, index) => (
                  <article
                    key={article.slug}
                    onClick={() => handleArticleClick(article)}
                    className="flex gap-3 cursor-pointer group"
                  >
                    <span className="text-2xl font-bold text-gray-200">
                      {index + 1}
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-pink-600 uppercase">
                        {article.category}
                      </span>
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-pink-600 transition-colors">
                        {article.title}
                      </h4>
                    </div>
                  </article>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => navigateToPortal(`/${locale}`)}
                className="w-full mt-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition-colors"
              >
                {defaultTranslations.viewAll[locale]}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
