'use client';

import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { HomeLayoutProps } from '@/lib/templates/types';

export function MinimalHomepage({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;

  return (
    <div className="py-12">
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: '800px' }}
      >
        {/* Simple Header */}
        <header className="mb-16 text-center">
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ 
              fontFamily: template.typography.headingFont,
              fontWeight: template.typography.headingWeight,
              color: colors.text,
            }}
          >
            {locale === 'de' ? 'Neueste Artikel' : 'Latest Articles'}
          </h1>
          <p 
            className="text-lg"
            style={{ color: colors.textMuted }}
          >
            {locale === 'de' ? 'Aktuelle Nachrichten und Analysen' : 'News and analysis'}
          </p>
        </header>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.filter(c => c.enabled).slice(0, 6).map((cat) => (
            <a
              key={cat.slug}
              href={`/${locale}/categories/${cat.slug}`}
              className="px-4 py-1.5 text-sm font-medium rounded-full transition-colors border"
              style={{ 
                borderColor: colors.border,
                color: colors.text,
              }}
            >
              {cat.displayName[locale as 'de' | 'en'] || cat.displayName.de}
            </a>
          ))}
        </div>

        {/* Article List */}
        <div className="space-y-0">
          {articles.map((article, index) => (
            <article 
              key={article.slug}
              className="group py-8 border-b"
              style={{ borderColor: colors.border }}
            >
              {/* Number */}
              <span 
                className="text-6xl font-bold opacity-10 mb-4 block"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  color: colors.text,
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              {/* Category & Date */}
              <div className="flex items-center gap-3 mb-3">
                {article.category && (
                  <span 
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: colors.accent }}
                  >
                    {article.category}
                  </span>
                )}
                {article.date && (
                  <>
                    <span style={{ color: colors.border }}>•</span>
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
                  className="text-2xl md:text-3xl font-bold mb-3 leading-tight transition-colors"
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
              {article.excerpt && (
                <p 
                  className="text-base leading-relaxed mb-4"
                  style={{ 
                    fontFamily: template.typography.bodyFont,
                    color: colors.textMuted,
                  }}
                >
                  {article.excerpt}
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
                  className="flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: colors.accent }}
                >
                  {locale === 'de' ? 'Lesen' : 'Read'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Load More */}
        {articles.length >= 10 && (
          <div className="text-center mt-12">
            <button
              className="px-8 py-3 text-sm font-medium border rounded-full transition-colors"
              style={{ 
                borderColor: colors.border,
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
