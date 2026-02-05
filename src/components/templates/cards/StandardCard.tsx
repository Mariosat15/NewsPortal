'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, User } from 'lucide-react';
import { ArticleCardProps } from '@/lib/templates/types';

export function StandardCard({ article, template, locale, showCategory = true, showAuthor = true, showReadingTime = true }: ArticleCardProps) {
  const colors = template.activeColors;
  const features = template.features;
  
  // Support both naming conventions
  const imageUrl = article.image || article.thumbnail;
  const excerptText = article.excerpt || article.teaser;
  const dateText = article.date || article.publishDate;
  
  const displayAuthor = showAuthor && features.showAuthor;
  const displayReadingTime = showReadingTime && features.showReadingTime;
  const displayCategory = showCategory && features.categoryBadges;

  return (
    <article 
      className="group flex flex-col h-full overflow-hidden transition-all"
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
      {/* Image Container */}
      <Link 
        href={`/${locale}/article/${article.slug}`}
        className="relative aspect-video overflow-hidden"
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
            <span style={{ color: colors.textMuted }}>
              {locale === 'de' ? 'Kein Bild' : 'No image'}
            </span>
          </div>
        )}
        
        {/* Category Badge */}
        {displayCategory && article.category && (
          <span 
            className="absolute top-3 left-3 px-2 py-1 text-xs font-semibold uppercase tracking-wider"
            style={{ 
              backgroundColor: colors.accent,
              color: 'white',
              borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.25rem',
            }}
          >
            {article.category}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <Link href={`/${locale}/article/${article.slug}`}>
          <h3 
            className="text-lg font-bold line-clamp-2 mb-2 transition-colors"
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
            className="text-sm line-clamp-2 mb-3 flex-1"
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
          className="flex items-center gap-3 text-xs mt-auto pt-3 border-t"
          style={{ 
            color: colors.textMuted,
            borderColor: colors.border,
          }}
        >
          {displayAuthor && article.author && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {article.author}
            </span>
          )}
          {displayReadingTime && article.readingTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readingTime}
            </span>
          )}
          {dateText && (
            <span className="ml-auto">{dateText}</span>
          )}
        </div>
      </div>
    </article>
  );
}
