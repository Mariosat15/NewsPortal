'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, Bookmark, User } from 'lucide-react';
import { HomeLayoutProps } from '@/lib/templates/types';

export function MinimalHomepage({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;
  
  const featuredArticle = articles[0];
  const remainingArticles = articles.slice(1);

  return (
    <div className="py-16 md:py-20">
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: '720px' }}
      >
        {/* Simple Header */}
        <header className="mb-16 text-center">
          <p 
            className="text-sm uppercase tracking-[0.3em] mb-4"
            style={{ color: colors.textMuted }}
          >
            {new Date().toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <h1 
            className="text-4xl md:text-5xl font-bold mb-5 leading-tight"
            style={{ 
              fontFamily: template.typography.headingFont,
              fontWeight: template.typography.headingWeight,
              color: colors.text,
            }}
          >
            {locale === 'de' ? 'Neueste Artikel' : 'Latest Articles'}
          </h1>
          <div 
            className="w-16 h-1 mx-auto"
            style={{ backgroundColor: colors.accent }}
          />
        </header>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          <Link
            href={`/${locale}`}
            className="px-5 py-2 text-sm font-medium rounded-full transition-all"
            style={{ 
              backgroundColor: colors.accent,
              color: 'white',
            }}
          >
            {locale === 'de' ? 'Alle' : 'All'}
          </Link>
          {categories.filter(c => c.enabled).slice(0, 5).map((cat) => (
            <Link
              key={cat.slug}
              href={`/${locale}/categories/${cat.slug}`}
              className="px-5 py-2 text-sm font-medium rounded-full transition-all hover:bg-black/5"
              style={{ 
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
            >
              {cat.displayName[locale as 'de' | 'en'] || cat.displayName.de}
            </Link>
          ))}
        </div>

        {/* Featured Article */}
        {featuredArticle && (
          <article className="mb-16 pb-16 border-b" style={{ borderColor: colors.border }}>
            <Link 
              href={`/${locale}/article/${featuredArticle.slug}`}
              className="group block"
            >
              {(featuredArticle.image || featuredArticle.thumbnail) && (
                <div className="relative aspect-[16/9] mb-8 overflow-hidden rounded-sm">
                  <Image
                    src={featuredArticle.image || featuredArticle.thumbnail || ''}
                    alt={featuredArticle.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-102"
                    priority
                  />
                </div>
              )}
              
              {featuredArticle.category && (
                <span 
                  className="text-xs font-semibold uppercase tracking-[0.15em] mb-4 block"
                  style={{ color: colors.accent }}
                >
                  {featuredArticle.category}
                </span>
              )}
              
              <h2 
                className="text-3xl md:text-4xl font-bold mb-5 leading-[1.2] group-hover:underline decoration-2 underline-offset-4"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  fontWeight: template.typography.headingWeight,
                  color: colors.text,
                }}
              >
                {featuredArticle.title}
              </h2>
              
              {(featuredArticle.excerpt || featuredArticle.teaser) && (
                <p 
                  className="text-lg leading-relaxed mb-6"
                  style={{ 
                    fontFamily: template.typography.bodyFont,
                    color: colors.textMuted,
                  }}
                >
                  {featuredArticle.excerpt || featuredArticle.teaser}
                </p>
              )}
              
              <div 
                className="flex items-center gap-4 text-sm"
                style={{ color: colors.textMuted }}
              >
                {featuredArticle.author && (
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{featuredArticle.author}</span>
                  </span>
                )}
                {featuredArticle.date && (
                  <span>{featuredArticle.date}</span>
                )}
                {featuredArticle.readingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredArticle.readingTime}
                  </span>
                )}
              </div>
            </Link>
          </article>
        )}

        {/* Article List */}
        <div className="space-y-0">
          {remainingArticles.map((article, index) => (
            <article 
              key={article.slug}
              className="group py-10 border-b last:border-b-0"
              style={{ borderColor: colors.border }}
            >
              <div className="flex gap-6">
                {/* Number */}
                <span 
                  className="text-5xl font-bold opacity-[0.08] leading-none shrink-0 w-16 hidden md:block"
                  style={{ 
                    fontFamily: template.typography.headingFont,
                    color: colors.text,
                  }}
                >
                  {String(index + 2).padStart(2, '0')}
                </span>
                
                <div className="flex-1">
                  {/* Category & Date */}
                  <div className="flex items-center gap-3 mb-3">
                    {article.category && (
                      <span 
                        className="text-xs font-semibold uppercase tracking-[0.15em]"
                        style={{ color: colors.accent }}
                      >
                        {article.category}
                      </span>
                    )}
                    {article.date && (
                      <>
                        <span style={{ color: colors.border }}>·</span>
                        <span 
                          className="text-xs"
                          style={{ color: colors.textMuted }}
                        >
                          {article.date}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <Link href={`/${locale}/article/${article.slug}`}>
                    <h2 
                      className="text-xl md:text-2xl font-bold mb-3 leading-snug transition-all group-hover:underline decoration-1 underline-offset-4"
                      style={{ 
                        fontFamily: template.typography.headingFont,
                        fontWeight: template.typography.headingWeight,
                        color: colors.text,
                      }}
                    >
                      {article.title}
                    </h2>
                  </Link>

                  {/* Excerpt */}
                  {(article.excerpt || article.teaser) && (
                    <p 
                      className="text-base leading-relaxed mb-4 line-clamp-2"
                      style={{ 
                        fontFamily: template.typography.bodyFont,
                        color: colors.textMuted,
                      }}
                    >
                      {article.excerpt || article.teaser}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-4 text-sm"
                      style={{ color: colors.textMuted }}
                    >
                      {article.author && (
                        <span className="font-medium">{article.author}</span>
                      )}
                      {article.readingTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {article.readingTime}
                        </span>
                      )}
                    </div>

                    <Link 
                      href={`/${locale}/article/${article.slug}`}
                      className="flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: colors.accent }}
                    >
                      {locale === 'de' ? 'Lesen' : 'Read'}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load More */}
        {articles.length >= 10 && (
          <div className="text-center mt-16">
            <button
              className="px-10 py-4 text-sm font-medium tracking-wide rounded-full transition-all hover:scale-105"
              style={{ 
                border: `2px solid ${colors.text}`,
                color: colors.text,
              }}
            >
              {locale === 'de' ? 'Mehr Artikel laden' : 'Load more articles'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
