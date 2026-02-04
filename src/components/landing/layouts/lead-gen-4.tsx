'use client';

/**
 * Lead Gen Layout 4: Carousel hero + news ticker + category sections
 * Dynamic layout with animated elements
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { BannerStrip } from '../sections/banner-strip';
import { LanguageSwitcher } from '../language-switcher';
import { trackLinkClick, navigateToPortal } from '@/lib/tracking/tracker';
import { LandingPageConfig, LandingPageLocale } from '@/lib/db/models/landing-page';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Article {
  slug: string;
  title: string;
  teaser: string;
  thumbnail: string;
  category: string;
}

interface LeadGen4Props {
  config: LandingPageConfig;
  articles: Article[];
  locale: LandingPageLocale;
  slug: string;
}

// Default translations
const defaultTranslations = {
  viewAll: { en: 'View All', de: 'Alle anzeigen' },
  discoverMore: { en: 'Discover More', de: 'Mehr entdecken' },
  visitPortal: { en: 'Visit Portal', de: 'Zum Portal' },
};

export function LeadGen4Layout({ config, articles, locale, slug }: LeadGen4Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroArticles = articles.slice(0, 4);
  const tickerArticles = articles.slice(0, 6);

  // Group articles by category
  const categorizedArticles = articles.reduce((acc, article) => {
    const cat = article.category || 'news';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

  const categories = Object.keys(categorizedArticles).slice(0, 4);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroArticles.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroArticles.length]);

  const handleArticleClick = (article: Article) => {
    const url = `/${locale}/article/${article.slug}`;
    trackLinkClick(url, article.slug, article.title);
    navigateToPortal(url);
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroArticles.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroArticles.length) % heroArticles.length);

  return (
    <div className="min-h-screen bg-white">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher currentLocale={locale} slug={slug} variant="dropdown" />
      </div>

      {/* News Ticker */}
      {config.showNewsTicker !== false && (
        <div className="bg-gray-900 text-white py-2 overflow-hidden">
          <div className="flex animate-ticker">
            {[...tickerArticles, ...tickerArticles].map((article, index) => (
              <span
                key={`${article.slug}-${index}`}
                onClick={() => handleArticleClick(article)}
                className="whitespace-nowrap mx-8 cursor-pointer hover:text-pink-400 transition-colors"
              >
                <span className="text-pink-500 font-bold mr-2">{article.category.toUpperCase()}</span>
                {article.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Carousel Hero */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        {heroArticles.map((article, index) => (
          <div
            key={article.slug}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <Image
              src={article.thumbnail}
              alt={article.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div
              onClick={() => handleArticleClick(article)}
              className="absolute bottom-0 left-0 right-0 p-8 md:p-12 cursor-pointer"
            >
              <span className="px-3 py-1 bg-pink-600 text-white text-xs font-bold uppercase rounded">
                {article.category}
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 max-w-4xl hover:text-pink-200 transition-colors">
                {article.title}
              </h2>
              <p className="text-white/80 mt-3 max-w-2xl line-clamp-2 hidden md:block">
                {article.teaser}
              </p>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroArticles.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-pink-500' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Banner Strip */}
      {config.banners && config.banners.length > 0 && (
        <BannerStrip banners={config.banners} layout="triple" height="small" />
      )}

      {/* Category Sections */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {categories.map((category) => {
          const categoryArticles = categorizedArticles[category].slice(0, 4);
          if (categoryArticles.length < 2) return null;

          return (
            <section key={category} className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  {category}
                </h2>
                <button
                  onClick={() => navigateToPortal(`/${locale}/categories/${category}`)}
                  className="text-pink-600 hover:text-pink-700 font-medium"
                >
                  {defaultTranslations.viewAll[locale]} →
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categoryArticles.map((article) => (
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
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-pink-600 transition-colors">
                      {article.title}
                    </h3>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Footer CTA */}
      <section className="bg-gray-900 py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          {defaultTranslations.discoverMore[locale]}
        </h2>
        <button
          onClick={() => navigateToPortal(`/${locale}`)}
          className="px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition-colors"
        >
          {defaultTranslations.visitPortal[locale]}
        </button>
      </section>

      {/* CSS for ticker animation */}
      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 30s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
