'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { ArticleCardProps } from '@/lib/templates/types';

export function MinimalCard({ article, template, locale, showCategory = true, showReadingTime = true }: ArticleCardProps) {
  const colors = template.activeColors;
  const features = template.features;

  return (
    <article className="group py-4 border-b" style={{ borderColor: colors.border }}>
      {/* Category & Date Row */}
      <div className="flex items-center gap-2 mb-2 text-xs">
        {showCategory && features.categoryBadges && article.category && (
          <>
            <span 
              className="font-semibold uppercase tracking-wider"
              style={{ color: colors.accent }}
            >
              {article.category}
            </span>
            <span style={{ color: colors.border }}>•</span>
          </>
        )}
        {article.date && (
          <span style={{ color: colors.textMuted }}>{article.date}</span>
        )}
      </div>

      {/* Title */}
      <Link href={`/${locale}/article/${article.slug}`}>
        <h3 
          className="text-lg font-semibold line-clamp-2 mb-2 transition-colors group-hover:underline decoration-1 underline-offset-4"
          style={{ 
            fontFamily: template.typography.headingFont,
            color: colors.text,
          }}
        >
          {article.title}
        </h3>
      </Link>

      {/* Excerpt */}
      {article.excerpt && (
        <p 
          className="text-sm line-clamp-2 mb-2"
          style={{ 
            fontFamily: template.typography.bodyFont,
            color: colors.textMuted,
          }}
        >
          {article.excerpt}
        </p>
      )}

      {/* Reading Time */}
      {showReadingTime && features.showReadingTime && article.readingTime && (
        <div 
          className="flex items-center gap-1 text-xs"
          style={{ color: colors.textMuted }}
        >
          <Clock className="w-3 h-3" />
          {article.readingTime}
        </div>
      )}
    </article>
  );
}
