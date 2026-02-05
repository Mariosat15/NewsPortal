'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, User, ArrowRight } from 'lucide-react';
import { HomeLayoutProps } from '@/lib/templates/types';
import { MinimalCard } from '../cards/MinimalCard';

export function EditorialHomepage({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;
  
  const leadArticle = articles[0];
  const secondaryArticles = articles.slice(1, 4);
  const opinionArticles = articles.slice(4, 8);
  const latestArticles = articles.slice(8);

  return (
    <div className="py-8">
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Lead Story */}
        {leadArticle && (
          <section className="mb-12">
            <article className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Image */}
              <Link 
                href={`/${locale}/article/${leadArticle.slug}`}
                className="relative aspect-[4/3] overflow-hidden"
                style={{ 
                  borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.5rem',
                }}
              >
                {leadArticle.image ? (
                  <Image
                    src={leadArticle.image}
                    alt={leadArticle.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full"
                    style={{ backgroundColor: colors.surfaceAlt }}
                  />
                )}
              </Link>

              {/* Content */}
              <div>
                {leadArticle.category && (
                  <span 
                    className="text-sm font-semibold uppercase tracking-wider mb-3 block"
                    style={{ color: colors.accent }}
                  >
                    {leadArticle.category}
                  </span>
                )}
                
                <Link href={`/${locale}/article/${leadArticle.slug}`}>
                  <h1 
                    className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
                    style={{ 
                      fontFamily: template.typography.headingFont,
                      fontWeight: template.typography.headingWeight,
                      color: colors.text,
                    }}
                  >
                    {leadArticle.title}
                  </h1>
                </Link>

                {leadArticle.excerpt && (
                  <p 
                    className="text-lg mb-6 leading-relaxed"
                    style={{ 
                      fontFamily: template.typography.bodyFont,
                      color: colors.textMuted,
                    }}
                  >
                    {leadArticle.excerpt}
                  </p>
                )}

                <div 
                  className="flex items-center gap-4 text-sm"
                  style={{ color: colors.textMuted }}
                >
                  {leadArticle.author && (
                    <span className="flex items-center gap-1 font-medium">
                      <User className="w-4 h-4" />
                      {leadArticle.author}
                    </span>
                  )}
                  {leadArticle.readingTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {leadArticle.readingTime}
                    </span>
                  )}
                </div>
              </div>
            </article>
          </section>
        )}

        {/* Secondary Stories */}
        <section 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 mb-12 border-b"
          style={{ borderColor: colors.border }}
        >
          {secondaryArticles.map((article) => (
            <article key={article.slug}>
              <Link 
                href={`/${locale}/article/${article.slug}`}
                className="relative aspect-video block mb-4 overflow-hidden"
                style={{ 
                  borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.375rem',
                }}
              >
                {article.image ? (
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full"
                    style={{ backgroundColor: colors.surfaceAlt }}
                  />
                )}
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
                <h2 
                  className="text-xl font-bold mb-2 line-clamp-2"
                  style={{ 
                    fontFamily: template.typography.headingFont,
                    color: colors.text,
                  }}
                >
                  {article.title}
                </h2>
              </Link>

              {article.excerpt && (
                <p 
                  className="text-sm line-clamp-2"
                  style={{ color: colors.textMuted }}
                >
                  {article.excerpt}
                </p>
              )}
            </article>
          ))}
        </section>

        {/* Opinion & Analysis + Latest */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Opinion Column */}
          <div>
            <h3 
              className="text-lg font-bold uppercase tracking-wider mb-6 pb-3 border-b"
              style={{ 
                fontFamily: template.typography.headingFont,
                color: colors.text,
                borderColor: colors.accent,
              }}
            >
              {locale === 'de' ? 'Meinung' : 'Opinion'}
            </h3>

            <div>
              {opinionArticles.map((article) => (
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

          {/* Latest News */}
          <div className="lg:col-span-2">
            <div 
              className="flex items-center justify-between mb-6 pb-3 border-b"
              style={{ borderColor: colors.accent }}
            >
              <h3 
                className="text-lg font-bold uppercase tracking-wider"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  color: colors.text,
                }}
              >
                {locale === 'de' ? 'Neueste Nachrichten' : 'Latest News'}
              </h3>
              <a 
                href={`/${locale}`}
                className="flex items-center gap-1 text-sm font-medium"
                style={{ color: colors.accent }}
              >
                {locale === 'de' ? 'Alle' : 'View all'}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latestArticles.slice(0, 6).map((article) => (
                <MinimalCard
                  key={article.slug}
                  article={article}
                  template={template}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
