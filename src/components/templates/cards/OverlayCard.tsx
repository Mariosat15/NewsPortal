'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, User } from 'lucide-react';
import { ArticleCardProps } from '@/lib/templates/types';

export function OverlayCard({ article, template, locale, showCategory = true, showAuthor = true, showReadingTime = true, size = 'medium' }: ArticleCardProps & { size?: 'small' | 'medium' | 'large' }) {
  const colors = template.activeColors;
  const features = template.features;

  const aspectRatio = size === 'large' ? 'aspect-[16/10]' : size === 'small' ? 'aspect-square' : 'aspect-video';
  const titleSize = size === 'large' ? 'text-2xl md:text-3xl' : size === 'small' ? 'text-sm' : 'text-lg';

  return (
    <article 
      className={`group relative ${aspectRatio} overflow-hidden`}
      style={{ 
        borderRadius: template.features.roundedCorners === 'none' ? '0' : 
                      template.features.roundedCorners === 'sm' ? '0.25rem' :
                      template.features.roundedCorners === 'md' ? '0.5rem' :
                      template.features.roundedCorners === 'lg' ? '0.75rem' : '1rem',
      }}
    >
      {/* Background Image */}
      <Link href={`/${locale}/article/${article.slug}`} className="absolute inset-0">
        {article.image ? (
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div 
            className="w-full h-full"
            style={{ backgroundColor: colors.primary }}
          />
        )}
        
        {/* Gradient Overlay */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
          }}
        />
      </Link>

      {/* Category Badge */}
      {showCategory && features.categoryBadges && article.category && (
        <span 
          className="absolute top-4 left-4 px-2 py-1 text-xs font-bold uppercase tracking-wider"
          style={{ 
            backgroundColor: colors.accent,
            color: 'white',
            borderRadius: '0.25rem',
          }}
        >
          {article.category}
        </span>
      )}

      {/* Content Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
        <Link href={`/${locale}/article/${article.slug}`}>
          <h3 
            className={`${titleSize} font-bold line-clamp-3 text-white mb-2 transition-colors`}
            style={{ 
              fontFamily: template.typography.headingFont,
              fontWeight: template.typography.headingWeight,
            }}
          >
            {article.title}
          </h3>
        </Link>

        {size !== 'small' && article.excerpt && (
          <p className="text-sm text-white/80 line-clamp-2 mb-3 hidden md:block">
            {article.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-white/70">
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
          {article.date && (
            <span>{article.date}</span>
          )}
        </div>
      </div>
    </article>
  );
}
