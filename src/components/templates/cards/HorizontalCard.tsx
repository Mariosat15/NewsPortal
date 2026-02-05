'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, User, ArrowRight } from 'lucide-react';
import { ArticleCardProps } from '@/lib/templates/types';

export function HorizontalCard({ article, template, locale, showCategory = true, showAuthor = true, showReadingTime = true }: ArticleCardProps) {
  const colors = template.activeColors;
  const features = template.features;

  // Support both naming conventions
  const imageUrl = article.image || article.thumbnail;
  const excerptText = article.excerpt || article.teaser;
  const dateText = article.date || article.publishDate;

  return (
    <article 
      className="group flex gap-4 md:gap-6 p-4 transition-all"
      style={{ 
        backgroundColor: colors.surface,
        borderRadius: template.features.roundedCorners === 'none' ? '0' : 
                      template.features.roundedCorners === 'sm' ? '0.25rem' :
                      template.features.roundedCorners === 'md' ? '0.5rem' :
                      template.features.roundedCorners === 'lg' ? '0.75rem' : '1rem',
        boxShadow: template.features.shadows === 'none' ? 'none' :
                   template.features.shadows === 'subtle' ? '0 1px 3px rgba(0,0,0,0.08)' :
                   template.features.shadows === 'medium' ? '0 4px 6px rgba(0,0,0,0.1)' :
                   '0 10px 25px rgba(0,0,0,0.15)',
      }}
    >
      {/* Image */}
      <Link 
        href={`/${locale}/article/${article.slug}`}
        className="relative w-32 md:w-48 shrink-0 aspect-[4/3] overflow-hidden"
        style={{ 
          borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.375rem',
        }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: colors.surfaceAlt }}
          >
            <span style={{ color: colors.textMuted }}>—</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0 py-1">
        {/* Category */}
        {showCategory && features.categoryBadges && article.category && (
          <span 
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: colors.accent }}
          >
            {article.category}
          </span>
        )}

        <Link href={`/${locale}/article/${article.slug}`}>
          <h3 
            className="text-lg md:text-xl font-bold line-clamp-2 mb-2 transition-colors group-hover:underline decoration-2 underline-offset-4"
            style={{ 
              fontFamily: template.typography.headingFont,
              fontWeight: template.typography.headingWeight,
              color: colors.text,
            }}
          >
            {article.title}
          </h3>
        </Link>

        {excerptText && (
          <p 
            className="text-sm line-clamp-2 mb-3 hidden md:block"
            style={{ 
              fontFamily: template.typography.bodyFont,
              color: colors.textMuted,
            }}
          >
            {excerptText}
          </p>
        )}

        {/* Meta */}
        <div 
          className="flex items-center flex-wrap gap-3 text-xs mt-auto"
          style={{ color: colors.textMuted }}
        >
          {showAuthor && features.showAuthor && article.author && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {article.author}
            </span>
          )}
          {showReadingTime && features.showReadingTime && article.readingTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readingTime}
            </span>
          )}
          {dateText && (
            <span>{dateText}</span>
          )}
          
          <Link 
            href={`/${locale}/article/${article.slug}`}
            className="hidden md:flex items-center gap-1 ml-auto font-medium transition-colors"
            style={{ color: colors.accent }}
          >
            {locale === 'de' ? 'Weiterlesen' : 'Read more'}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
