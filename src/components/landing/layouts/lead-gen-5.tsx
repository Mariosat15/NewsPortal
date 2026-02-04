'use client';

/**
 * Lead Gen Layout 5: Magazine style with multiple sections
 * Premium layout with rich visual hierarchy
 */

import Image from 'next/image';
import { HeroBanner } from '../sections/hero-banner';
import { CtaSection } from '../sections/cta-section';
import { LanguageSwitcher } from '../language-switcher';
import { trackLinkClick, navigateToPortal } from '@/lib/tracking/tracker';
import { LandingPageConfig, LandingPageLocale, getTranslatedText } from '@/lib/db/models/landing-page';
import { Flame, Clock, TrendingUp } from 'lucide-react';

interface Article {
  slug: string;
  title: string;
  teaser: string;
  thumbnail: string;
  category: string;
}

interface LeadGen5Props {
  config: LandingPageConfig;
  articles: Article[];
  locale: LandingPageLocale;
  slug: string;
}

// Default translations
const defaultTranslations = {
  trending: { en: 'Trending', de: 'Trending' },
  latestArticles: { en: 'Latest Articles', de: 'Neueste Artikel' },
  popular: { en: 'Popular', de: 'Beliebt' },
  discoverMore: { en: 'Discover More', de: 'Mehr entdecken' },
  diveInto: { en: 'Dive into our world of news', de: 'Tauchen Sie ein in unsere Welt der Nachrichten' },
  visitPortal: { en: 'Visit Portal', de: 'Zum Portal' },
};

export function LeadGen5Layout({ config, articles, locale, slug }: LeadGen5Props) {
  const featuredArticle = articles[0];
  const secondaryArticles = articles.slice(1, 4);
  const trendingArticles = articles.slice(4, 9);
  const latestArticles = articles.slice(9, 15);
  const moreArticles = articles.slice(15, 21);

  const handleArticleClick = (article: Article) => {
    const url = `/${locale}/article/${article.slug}`;
    trackLinkClick(url, article.slug, article.title);
    navigateToPortal(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher currentLocale={locale} slug={slug} variant="dropdown" />
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Featured */}
            <div className="lg:col-span-8">
              {featuredArticle && (
                <article
                  onClick={() => handleArticleClick(featuredArticle)}
                  className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden cursor-pointer group"
                >
                  <Image
                    src={featuredArticle.thumbnail}
                    alt={featuredArticle.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <span className="px-3 py-1 bg-pink-600 text-white text-xs font-bold uppercase rounded">
                      {featuredArticle.category}
                    </span>
                    <h1 className="text-2xl md:text-4xl font-bold text-white mt-4 group-hover:text-pink-200 transition-colors">
                      {featuredArticle.title}
                    </h1>
                    <p className="text-white/80 mt-3 line-clamp-2 max-w-2xl hidden md:block">
                      {featuredArticle.teaser}
                    </p>
                  </div>
                </article>
              )}
            </div>

            {/* Secondary Articles */}
            <div className="lg:col-span-4 space-y-4">
              {secondaryArticles.map((article) => (
                <article
                  key={article.slug}
                  onClick={() => handleArticleClick(article)}
                  className="flex gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 cursor-pointer group hover:bg-white/20 transition-colors"
                >
                  <div className="relative w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={article.thumbnail}
                      alt={article.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-pink-400 uppercase">
                      {article.category}
                    </span>
                    <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-pink-200 transition-colors mt-1">
                      {article.title}
                    </h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Trending Section */}
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Flame className="w-5 h-5 text-pink-600" />
                <span className="font-bold text-gray-900">
                  {defaultTranslations.trending[locale]}
                </span>
              </div>
              <div className="space-y-4">
                {trendingArticles.map((article, index) => (
                  <article
                    key={article.slug}
                    onClick={() => handleArticleClick(article)}
                    className="flex gap-3 cursor-pointer group"
                  >
                    <span className="text-2xl font-bold text-gray-200">{index + 1}</span>
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
            </div>
          </aside>

          {/* Latest Articles */}
          <main className="lg:col-span-6 order-1 lg:order-2">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-gray-900">
                {getTranslatedText(config.sectionTitles?.latestNews, defaultTranslations.latestArticles[locale], locale)}
              </span>
            </div>
            <div className="space-y-5">
              {latestArticles.map((article) => (
                <article
                  key={article.slug}
                  onClick={() => handleArticleClick(article)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative sm:w-48 h-40 sm:h-auto flex-shrink-0">
                      <Image
                        src={article.thumbnail}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <span className="text-[10px] font-bold text-pink-600 uppercase">
                        {article.category}
                      </span>
                      <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-pink-600 transition-colors mt-1">
                        {article.title}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2 mt-2">
                        {article.teaser}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </main>

          {/* Popular Section */}
          <aside className="lg:col-span-3 order-3">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-gray-900">
                  {getTranslatedText(config.sectionTitles?.popularArticles, defaultTranslations.popular[locale], locale)}
                </span>
              </div>
              <div className="space-y-4">
                {moreArticles.slice(0, 5).map((article) => (
                  <article
                    key={article.slug}
                    onClick={() => handleArticleClick(article)}
                    className="cursor-pointer group"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                      <Image
                        src={article.thumbnail}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-pink-600 uppercase">
                      {article.category}
                    </span>
                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-pink-600 transition-colors">
                      {article.title}
                    </h4>
                  </article>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* CTA Section */}
      <CtaSection
        title={getTranslatedText(config.sectionTitles?.discoverMore, defaultTranslations.discoverMore[locale], locale)}
        subtitle={defaultTranslations.diveInto[locale]}
        buttons={config.ctaButtons?.length ? config.ctaButtons.map(btn => ({
          ...btn,
          text: btn.textTranslations ? getTranslatedText(btn.textTranslations, btn.text, locale) : btn.text,
        })) : [
          { id: 'main-cta', text: defaultTranslations.visitPortal[locale], link: `/${locale}`, color: '#e91e8c' },
        ]}
        background="gradient"
      />
    </div>
  );
}
