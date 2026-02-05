'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, User } from 'lucide-react';
import { CategoryLayoutProps } from '@/lib/templates/types';

export function TimelineLayout({ template, articles, locale, categoryName }: CategoryLayoutProps) {
  const colors = template.activeColors;

  // Group articles by date
  const groupedArticles = articles.reduce((groups, article) => {
    const date = article.date || 'Unknown';
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(article);
    return groups;
  }, {} as Record<string, typeof articles>);

  const dates = Object.keys(groupedArticles);

  return (
    <div className="py-8">
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Category Header */}
        <div className="mb-12 text-center">
          <h1 
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ 
              fontFamily: template.typography.headingFont,
              fontWeight: template.typography.headingWeight,
              color: colors.text,
            }}
          >
            {categoryName}
          </h1>
          <p 
            className="text-sm"
            style={{ color: colors.textMuted }}
          >
            {locale === 'de' ? 'Chronologische Übersicht' : 'Chronological Overview'}
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Timeline Line */}
          <div 
            className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
            style={{ backgroundColor: colors.border }}
          />

          {dates.map((date, dateIndex) => (
            <div key={date} className="mb-12 last:mb-0">
              {/* Date Marker */}
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
                  style={{ 
                    backgroundColor: colors.accent,
                    color: 'white',
                  }}
                >
                  {dateIndex + 1}
                </div>
                <span 
                  className="text-sm font-semibold"
                  style={{ color: colors.textMuted }}
                >
                  {date}
                </span>
              </div>

              {/* Articles for this date */}
              <div className="pl-12 md:pl-0 space-y-4">
                {groupedArticles[date].map((article, artIndex) => (
                  <article 
                    key={article.slug}
                    className={`relative p-4 transition-all ${
                      artIndex % 2 === 0 ? 'md:mr-[calc(50%+2rem)]' : 'md:ml-[calc(50%+2rem)]'
                    }`}
                    style={{ 
                      backgroundColor: colors.surface,
                      borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.5rem',
                      boxShadow: template.features.shadows === 'none' ? 'none' :
                                 template.features.shadows === 'subtle' ? '0 1px 3px rgba(0,0,0,0.08)' :
                                 '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                  >
                    {/* Connection dot */}
                    <div 
                      className="hidden md:block absolute top-6 w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: colors.accent,
                        [artIndex % 2 === 0 ? 'right' : 'left']: '-2rem',
                        transform: 'translateX(50%)',
                      }}
                    />

                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      {article.image && (
                        <Link 
                          href={`/${locale}/article/${article.slug}`}
                          className="relative w-20 h-20 shrink-0 overflow-hidden"
                          style={{ 
                            borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.375rem',
                          }}
                        >
                          <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            className="object-cover"
                          />
                        </Link>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {article.category && (
                          <span 
                            className="text-xs font-semibold uppercase tracking-wider"
                            style={{ color: colors.accent }}
                          >
                            {article.category}
                          </span>
                        )}
                        
                        <Link href={`/${locale}/article/${article.slug}`}>
                          <h3 
                            className="text-base font-semibold line-clamp-2 my-1"
                            style={{ 
                              fontFamily: template.typography.headingFont,
                              color: colors.text,
                            }}
                          >
                            {article.title}
                          </h3>
                        </Link>

                        <div 
                          className="flex items-center gap-3 text-xs"
                          style={{ color: colors.textMuted }}
                        >
                          {article.author && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {article.author}
                            </span>
                          )}
                          {article.readingTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {article.readingTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {articles.length === 0 && (
          <div 
            className="text-center py-16"
            style={{ color: colors.textMuted }}
          >
            <p className="text-lg">
              {locale === 'de' ? 'Keine Artikel in dieser Kategorie.' : 'No articles in this category.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
