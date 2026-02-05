'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, User, ArrowRight, Bookmark, Quote } from 'lucide-react';
import { HomeLayoutProps } from '@/lib/templates/types';
import { MinimalCard } from '../cards/MinimalCard';

export function EditorialHomepage({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;
  
  const leadArticle = articles[0];
  const secondaryArticles = articles.slice(1, 4);
  const opinionArticles = articles.slice(4, 8);
  const latestArticles = articles.slice(8);

  return (
    <div>
      {/* Date Header Bar */}
      <div 
        className="py-3 border-b"
        style={{ 
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <div 
          className="mx-auto px-4 flex items-center justify-between"
          style={{ maxWidth: template.spacing.containerMax }}
        >
          <span 
            className="text-sm"
            style={{ color: colors.textMuted }}
          >
            {new Date().toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
          <div className="flex items-center gap-4">
            {categories.filter(c => c.enabled).slice(0, 4).map((cat) => (
              <Link
                key={cat.slug}
                href={`/${locale}/categories/${cat.slug}`}
                className="text-xs font-medium uppercase tracking-wider hover:underline hidden md:block"
                style={{ color: colors.textMuted }}
              >
                {cat.displayName[locale as 'de' | 'en'] || cat.displayName.de}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="py-10">
        <div 
          className="mx-auto px-4"
          style={{ maxWidth: template.spacing.containerMax }}
        >
          {/* Lead Story - Traditional Newspaper Style */}
          {leadArticle && (
            <section className="mb-12">
              <article className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-7">
                  <Link 
                    href={`/${locale}/article/${leadArticle.slug}`}
                    className="group relative block aspect-[4/3] overflow-hidden mb-6"
                    style={{ 
                      borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.25rem',
                    }}
                  >
                    <Image
                      src={leadArticle.image || leadArticle.thumbnail || '/images/placeholder.jpg'}
                      alt={leadArticle.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-102"
                      priority
                    />
                  </Link>

                  {leadArticle.category && (
                    <span 
                      className="text-xs font-bold uppercase tracking-widest mb-4 block"
                      style={{ color: colors.accent }}
                    >
                      {leadArticle.category}
                    </span>
                  )}
                  
                  <Link href={`/${locale}/article/${leadArticle.slug}`}>
                    <h1 
                      className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 leading-[1.15] hover:underline decoration-2 underline-offset-4"
                      style={{ 
                        fontFamily: template.typography.headingFont,
                        fontWeight: template.typography.headingWeight,
                        color: colors.text,
                      }}
                    >
                      {leadArticle.title}
                    </h1>
                  </Link>

                  {(leadArticle.excerpt || leadArticle.teaser) && (
                    <p 
                      className="text-lg mb-6 leading-relaxed"
                      style={{ 
                        fontFamily: template.typography.bodyFont,
                        color: colors.textMuted,
                      }}
                    >
                      {leadArticle.excerpt || leadArticle.teaser}
                    </p>
                  )}

                  <div 
                    className="flex items-center gap-4 text-sm pt-4 border-t"
                    style={{ color: colors.textMuted, borderColor: colors.border }}
                  >
                    {leadArticle.author && (
                      <span className="font-semibold" style={{ color: colors.text }}>
                        {locale === 'de' ? 'Von' : 'By'} {leadArticle.author}
                      </span>
                    )}
                    {leadArticle.date && (
                      <span>{leadArticle.date}</span>
                    )}
                    {leadArticle.readingTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {leadArticle.readingTime}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sidebar Articles */}
                <div 
                  className="lg:col-span-5 lg:border-l lg:pl-8"
                  style={{ borderColor: colors.border }}
                >
                  <h3 
                    className="text-sm font-bold uppercase tracking-wider mb-6 pb-3 border-b-2"
                    style={{ 
                      color: colors.textMuted,
                      borderColor: colors.accent,
                    }}
                  >
                    {locale === 'de' ? 'Weitere Top-Nachrichten' : 'More Top Stories'}
                  </h3>
                  <div className="space-y-6">
                    {secondaryArticles.map((article, idx) => (
                      <article 
                        key={article.slug}
                        className="group pb-6 border-b last:border-b-0"
                        style={{ borderColor: colors.border }}
                      >
                        <span 
                          className="text-5xl font-bold opacity-10 block -mb-2"
                          style={{ fontFamily: template.typography.headingFont, color: colors.text }}
                        >
                          {String(idx + 2).padStart(2, '0')}
                        </span>
                        {article.category && (
                          <span 
                            className="text-xs font-semibold uppercase tracking-wider mb-2 block"
                            style={{ color: colors.accent }}
                          >
                            {article.category}
                          </span>
                        )}
                        <Link href={`/${locale}/article/${article.slug}`}>
                          <h3 
                            className="text-lg font-bold leading-snug group-hover:underline"
                            style={{ 
                              fontFamily: template.typography.headingFont,
                              color: colors.text,
                            }}
                          >
                            {article.title}
                          </h3>
                        </Link>
                        <p 
                          className="text-sm mt-2"
                          style={{ color: colors.textMuted }}
                        >
                          {article.date}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </article>
            </section>
          )}

          {/* Quote / Featured Box */}
          {opinionArticles[0] && (
            <div 
              className="my-10 p-8 relative"
              style={{ 
                backgroundColor: colors.surfaceAlt,
                borderLeft: `4px solid ${colors.accent}`,
              }}
            >
              <Quote 
                className="absolute top-4 right-4 w-12 h-12 opacity-10"
                style={{ color: colors.accent }}
              />
              <span 
                className="text-xs font-bold uppercase tracking-widest mb-3 block"
                style={{ color: colors.accent }}
              >
                {locale === 'de' ? 'Hervorgehoben' : 'Featured'}
              </span>
              <Link href={`/${locale}/article/${opinionArticles[0].slug}`}>
                <blockquote 
                  className="text-2xl md:text-3xl font-bold leading-snug hover:underline"
                  style={{ 
                    fontFamily: template.typography.headingFont,
                    color: colors.text,
                  }}
                >
                  {opinionArticles[0].title}
                </blockquote>
              </Link>
              {opinionArticles[0].author && (
                <p 
                  className="mt-4 font-medium"
                  style={{ color: colors.textMuted }}
                >
                  — {opinionArticles[0].author}
                </p>
              )}
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Latest News */}
            <div className="lg:col-span-2">
              <div 
                className="flex items-center justify-between mb-8 pb-3 border-b-2"
                style={{ borderColor: colors.accent }}
              >
                <h2 
                  className="text-xl font-bold uppercase tracking-wider"
                  style={{ 
                    fontFamily: template.typography.headingFont,
                    color: colors.text,
                  }}
                >
                  {locale === 'de' ? 'Neueste Nachrichten' : 'Latest News'}
                </h2>
                <Link 
                  href={`/${locale}`}
                  className="flex items-center gap-1 text-sm font-medium hover:underline"
                  style={{ color: colors.accent }}
                >
                  {locale === 'de' ? 'Alle anzeigen' : 'View all'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                {latestArticles.slice(0, 6).map((article) => (
                  <article key={article.slug} className="group">
                    <Link 
                      href={`/${locale}/article/${article.slug}`}
                      className="relative block aspect-video mb-4 overflow-hidden"
                      style={{ borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.25rem' }}
                    >
                      <Image
                        src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                    {article.category && (
                      <span 
                        className="text-xs font-semibold uppercase tracking-wider mb-2 block"
                        style={{ color: colors.accent }}
                      >
                        {article.category}
                      </span>
                    )}
                    <Link href={`/${locale}/article/${article.slug}`}>
                      <h3 
                        className="text-lg font-bold mb-2 leading-snug group-hover:underline"
                        style={{ 
                          fontFamily: template.typography.headingFont,
                          color: colors.text,
                        }}
                      >
                        {article.title}
                      </h3>
                    </Link>
                    <p 
                      className="text-sm"
                      style={{ color: colors.textMuted }}
                    >
                      {article.date}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Opinion Column */}
              <div>
                <h3 
                  className="text-sm font-bold uppercase tracking-wider mb-6 pb-3 border-b-2"
                  style={{ 
                    fontFamily: template.typography.headingFont,
                    color: colors.text,
                    borderColor: colors.accent,
                  }}
                >
                  {locale === 'de' ? 'Meinung & Analyse' : 'Opinion & Analysis'}
                </h3>

                <div className="space-y-5">
                  {opinionArticles.slice(1).map((article) => (
                    <MinimalCard
                      key={article.slug}
                      article={article}
                      template={template}
                      locale={locale}
                      showCategory={false}
                    />
                  ))}
                </div>
              </div>

              {/* Categories Box */}
              <div 
                className="p-6"
                style={{ 
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.5rem',
                }}
              >
                <h3 
                  className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"
                  style={{ color: colors.text }}
                >
                  <Bookmark className="w-4 h-4" style={{ color: colors.accent }} />
                  {locale === 'de' ? 'Kategorien' : 'Categories'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.filter(c => c.enabled).slice(0, 8).map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/${locale}/categories/${cat.slug}`}
                      className="px-3 py-1.5 text-xs font-medium rounded transition-colors hover:opacity-80"
                      style={{ 
                        backgroundColor: colors.surface,
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {cat.displayName[locale as 'de' | 'en'] || cat.displayName.de}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
