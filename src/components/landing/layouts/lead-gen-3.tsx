'use client';

/**
 * Lead Gen Layout 3: Video hero + featured articles + newsletter CTA
 * Engaging layout with video background option
 */

import Image from 'next/image';
import { CtaSection } from '../sections/cta-section';
import { LanguageSwitcher } from '../language-switcher';
import { trackLinkClick, trackCtaClick, navigateToPortal } from '@/lib/tracking/tracker';
import { LandingPageConfig, LandingPageLocale, getTranslatedText } from '@/lib/db/models/landing-page';
import { Play } from 'lucide-react';

interface Article {
  slug: string;
  title: string;
  teaser: string;
  thumbnail: string;
  category: string;
}

interface LeadGen3Props {
  config: LandingPageConfig;
  articles: Article[];
  locale: LandingPageLocale;
  slug: string;
}

// Default translations
const defaultTranslations = {
  latestNews: { en: 'The Latest News', de: 'Die neuesten Nachrichten' },
  stayUpToDate: { en: 'Stay up to date', de: 'Bleiben Sie auf dem Laufenden' },
  featured: { en: 'Featured', de: 'Im Fokus' },
  dontMissOut: { en: "Don't Miss Out", de: 'Nichts mehr verpassen' },
  getLatestNews: { en: 'Get the latest news delivered right to your inbox', de: 'Erhalten Sie die neuesten Nachrichten direkt in Ihr Postfach' },
  subscribeNow: { en: 'Subscribe Now', de: 'Jetzt abonnieren' },
  moreStories: { en: 'More Stories', de: 'Weitere Artikel' },
  discoverMore: { en: 'Discover More', de: 'Entdecken Sie mehr' },
  diveInto: { en: 'Dive into our world', de: 'Tauchen Sie ein in unsere Welt' },
  visitPortal: { en: 'Visit Portal', de: 'Zum Portal' },
};

export function LeadGen3Layout({ config, articles, locale, slug }: LeadGen3Props) {
  const featuredArticles = articles.slice(0, 3);
  const gridArticles = articles.slice(3, 9);

  const handleArticleClick = (article: Article) => {
    const url = `/${locale}/article/${article.slug}`;
    trackLinkClick(url, article.slug, article.title);
    navigateToPortal(url);
  };

  // Get translated texts
  const heroTitle = getTranslatedText(config.heroTitleTranslations, config.heroTitle, locale) || defaultTranslations.latestNews[locale];
  const heroSubtitle = getTranslatedText(config.heroSubtitleTranslations, config.heroSubtitle, locale) || defaultTranslations.stayUpToDate[locale];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher currentLocale={locale} slug={slug} variant="dropdown" />
      </div>

      {/* Video/Image Hero */}
      <section className="relative h-[70vh] overflow-hidden">
        {config.heroVideoUrl ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={config.heroVideoUrl} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={config.heroImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&h=900&fit=crop'}
            alt={heroTitle || 'Hero'}
            fill
            className="object-cover"
            priority
          />
        )}
        
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative h-full flex flex-col justify-center items-center text-center px-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 max-w-4xl">
            {heroTitle}
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl">
            {heroSubtitle}
          </p>
          
          {config.heroVideoUrl && (
            <button 
              onClick={() => trackCtaClick('play-video', '#', 'Play Video')}
              className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Play className="w-10 h-10 text-white ml-1" />
            </button>
          )}
        </div>
      </section>

      {/* Featured Articles */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {getTranslatedText(config.sectionTitles?.featuredStories, defaultTranslations.featured[locale], locale)}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredArticles.map((article, index) => (
              <article
                key={article.slug}
                onClick={() => handleArticleClick(article)}
                className={`cursor-pointer group ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
              >
                <div className={`relative ${index === 0 ? 'aspect-[16/10]' : 'aspect-video'} rounded-xl overflow-hidden`}>
                  <Image
                    src={article.thumbnail}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="px-3 py-1 bg-pink-600 text-white text-xs font-bold uppercase rounded">
                      {article.category}
                    </span>
                    <h3 className={`${index === 0 ? 'text-2xl md:text-3xl' : 'text-lg'} font-bold text-white mt-3 group-hover:text-pink-200 transition-colors`}>
                      {article.title}
                    </h3>
                    {index === 0 && (
                      <p className="text-white/80 mt-2 line-clamp-2 hidden md:block">
                        {article.teaser}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-gradient-to-r from-pink-600 to-purple-700 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {defaultTranslations.dontMissOut[locale]}
          </h2>
          <p className="text-white/90 mb-8">
            {defaultTranslations.getLatestNews[locale]}
          </p>
          <button
            onClick={() => {
              trackCtaClick('newsletter-cta', `/${locale}`, 'Subscribe');
              navigateToPortal(`/${locale}`);
            }}
            className="px-8 py-4 bg-white text-pink-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
          >
            {defaultTranslations.subscribeNow[locale]}
          </button>
        </div>
      </section>

      {/* More Articles Grid */}
      <section className="bg-gray-100 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {getTranslatedText(config.sectionTitles?.moreArticles, defaultTranslations.moreStories[locale], locale)}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {gridArticles.map((article) => (
              <article
                key={article.slug}
                onClick={() => handleArticleClick(article)}
                className="cursor-pointer group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={article.thumbnail}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <span className="text-xs font-bold text-pink-600 uppercase">
                    {article.category}
                  </span>
                  <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2 group-hover:text-pink-600 transition-colors">
                    {article.title}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <CtaSection
        title={getTranslatedText(config.sectionTitles?.discoverMore, defaultTranslations.discoverMore[locale], locale)}
        subtitle={defaultTranslations.diveInto[locale]}
        buttons={[
          { id: 'final-cta', text: defaultTranslations.visitPortal[locale], link: `/${locale}`, color: '#e91e8c' },
        ]}
        background="dark"
      />
    </div>
  );
}
