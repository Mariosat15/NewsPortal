'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { ArticleCardProps } from '@/lib/templates/types';

export function CompactCard({ article, template, locale, showCategory = true, showReadingTime = true }: ArticleCardProps) {
  const colors = template.activeColors;
  const features = template.features;

  // Support both naming conventions
  const imageUrl = article.image || article.thumbnail;
  const dateText = article.date || article.publishDate;

  return (
    <article 
      className="group flex gap-3 py-3 border-b last:border-b-0"
      style={{ borderColor: colors.border }}
    >
      {/* Small Thumbnail */}
      <Link 
        href={`/${locale}/article/${article.slug}`}
        className="relative w-20 h-20 shrink-0 overflow-hidden"
        style={{ 
          borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.25rem',
        }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: colors.surfaceAlt }}
          >
            <span className="text-xs" style={{ color: colors.textMuted }}>—</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Category */}
        {showCategory && features.categoryBadges && article.category && (
          <span 
            className="text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: colors.accent }}
          >
            {article.category}
          </span>
        )}

        <Link href={`/${locale}/article/${article.slug}`}>
          <h3 
            className="text-sm font-semibold line-clamp-2 transition-colors"
            style={{ 
              fontFamily: template.typography.headingFont,
              color: colors.text,
            }}
          >
            {article.title}
          </h3>
        </Link>

        {/* Meta */}
        <div 
          className="flex items-center gap-2 text-xs mt-auto"
          style={{ color: colors.textMuted }}
        >
          {showReadingTime && features.showReadingTime && article.readingTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readingTime}
            </span>
          )}
          {dateText && (
            <span>{dateText}</span>
          )}
        </div>
      </div>
    </article>
  );
}
