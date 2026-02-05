'use client';

import Link from 'next/link';
import Image from 'next/image';
import { HomeLayoutProps } from '@/lib/templates/types';
import { OverlayCard } from '../cards/OverlayCard';
import { BoldCard } from '../cards/BoldCard';
import { StandardCard } from '../cards/StandardCard';
import { Play, Flame, Clock } from 'lucide-react';

export function MasonryHomepage({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;

  // Create varied layout pattern
  const heroArticle = articles[0];
  const featuredArticles = articles.slice(1, 5);
  const columnArticles = articles.slice(5);
  
  // Distribute into columns
  const col1 = columnArticles.filter((_, i) => i % 3 === 0);
  const col2 = columnArticles.filter((_, i) => i % 3 === 1);
  const col3 = columnArticles.filter((_, i) => i % 3 === 2);

  return (
    <div>
      {/* Full-width Hero */}
      {heroArticle && (
        <section className="relative h-[70vh] min-h-[500px] max-h-[800px]">
          <Image
            src={heroArticle.image || heroArticle.thumbnail || '/images/placeholder.jpg'}
            alt={heroArticle.title}
            fill
            className="object-cover"
            priority
          />
          <div 
            className="absolute inset-0"
            style={{ 
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
            }}
          />
          
          {/* Hero Content */}
          <div 
            className="absolute inset-x-0 bottom-0 p-6 md:p-12"
            style={{ maxWidth: template.spacing.containerMax, margin: '0 auto' }}
          >
            <div className="max-w-3xl">
              {heroArticle.category && (
                <span 
                  className="inline-block px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white mb-4"
                  style={{ backgroundColor: colors.accent }}
                >
                  {heroArticle.category}
                </span>
              )}
              <Link href={`/${locale}/article/${heroArticle.slug}`}>
                <h1 
                  className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-[1.1] hover:underline decoration-4 underline-offset-8"
                  style={{ fontFamily: template.typography.headingFont }}
                >
                  {heroArticle.title}
                </h1>
              </Link>
              <p className="text-lg text-white/80 mb-6 max-w-2xl hidden md:block">
                {heroArticle.excerpt || heroArticle.teaser}
              </p>
              <div className="flex items-center gap-6 text-sm text-white/70">
                {heroArticle.author && (
                  <span className="font-semibold text-white">{heroArticle.author}</span>
                )}
                {heroArticle.date && <span>{heroArticle.date}</span>}
                {heroArticle.readingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {heroArticle.readingTime}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="py-10">
        <div 
          className="mx-auto px-4"
          style={{ maxWidth: template.spacing.containerMax }}
        >
          {/* Featured Grid - Bento Style */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <Flame className="w-6 h-6" style={{ color: colors.accent }} />
              <h2 
                className="text-2xl font-black uppercase tracking-tight"
                style={{ fontFamily: template.typography.headingFont, color: colors.text }}
              >
                {locale === 'de' ? 'Im Trend' : 'Trending Now'}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredArticles.map((article, idx) => (
                <Link
                  key={article.slug}
                  href={`/${locale}/article/${article.slug}`}
                  className={`group relative overflow-hidden ${
                    idx === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-[4/5]'
                  }`}
                  style={{ 
                    borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.75rem',
                  }}
                >
                  <Image
                    src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.9) 100%)',
                    }}
                  />
                  
                  {article.category && (
                    <span 
                      className="absolute top-3 left-3 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white"
                      style={{ backgroundColor: colors.accent }}
                    >
                      {article.category}
                    </span>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 
                      className={`font-bold text-white leading-tight line-clamp-3 ${
                        idx === 0 ? 'text-xl md:text-2xl' : 'text-sm'
                      }`}
                      style={{ fontFamily: template.typography.headingFont }}
                    >
                      {article.title}
                    </h3>
                    {idx === 0 && (
                      <p className="text-white/70 text-sm mt-2">{article.date}</p>
                    )}
                  </div>
                  
                  {/* Hover overlay */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.accent}33 0%, transparent 100%)`,
                    }}
                  />
                </Link>
              ))}
            </div>
          </section>

          {/* Section Divider */}
          <div className="flex items-center gap-4 mb-10">
            <div 
              className="flex-1 h-0.5"
              style={{ backgroundColor: colors.border }}
            />
            <h2 
              className="text-sm font-black uppercase tracking-widest"
              style={{ color: colors.textMuted }}
            >
              {locale === 'de' ? 'Alle Geschichten' : 'All Stories'}
            </h2>
            <div 
              className="flex-1 h-0.5"
              style={{ backgroundColor: colors.border }}
            />
          </div>

          {/* Masonry Grid */}
          <div 
            className="hidden md:grid grid-cols-3"
            style={{ gap: template.spacing.cardGap }}
          >
            {/* Column 1 */}
            <div className="space-y-6">
              {col1.map((article, i) => (
                i % 3 === 0 ? (
                  <BoldCard
                    key={article.slug}
                    article={article}
                    template={template}
                    locale={locale}
                  />
                ) : (
                  <StandardCard
                    key={article.slug}
                    article={article}
                    template={template}
                    locale={locale}
                  />
                )
              ))}
            </div>

            {/* Column 2 - offset for staggered effect */}
            <div className="space-y-6 mt-16">
              {col2.map((article, i) => (
                i % 2 === 1 ? (
                  <BoldCard
                    key={article.slug}
                    article={article}
                    template={template}
                    locale={locale}
                  />
                ) : (
                  <StandardCard
                    key={article.slug}
                    article={article}
                    template={template}
                    locale={locale}
                  />
                )
              ))}
            </div>

            {/* Column 3 */}
            <div className="space-y-6 mt-8">
              {col3.map((article, i) => (
                i % 4 === 0 ? (
                  <BoldCard
                    key={article.slug}
                    article={article}
                    template={template}
                    locale={locale}
                  />
                ) : (
                  <StandardCard
                    key={article.slug}
                    article={article}
                    template={template}
                    locale={locale}
                  />
                )
              ))}
            </div>
          </div>

          {/* Mobile: Grid */}
          <div 
            className="md:hidden grid grid-cols-1 sm:grid-cols-2"
            style={{ gap: template.spacing.cardGap }}
          >
            {columnArticles.map((article) => (
              <StandardCard
                key={article.slug}
                article={article}
                template={template}
                locale={locale}
              />
            ))}
          </div>

          {/* Load More Button */}
          {articles.length >= 12 && (
            <div className="text-center mt-12">
              <button
                className="px-10 py-4 font-black uppercase tracking-wider text-sm transition-all hover:scale-105"
                style={{ 
                  backgroundColor: colors.text,
                  color: colors.background,
                  borderRadius: template.features.roundedCorners === 'none' ? '0' : '9999px',
                }}
              >
                {locale === 'de' ? 'Mehr laden' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
