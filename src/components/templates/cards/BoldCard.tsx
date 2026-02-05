'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, User, ArrowUpRight } from 'lucide-react';
import { ArticleCardProps } from '@/lib/templates/types';

export function BoldCard({ article, template, locale, showCategory = true, showAuthor = true, showReadingTime = true }: ArticleCardProps) {
  const colors = template.activeColors;
  const features = template.features;

  return (
    <article 
      className="group relative overflow-hidden"
      style={{ 
        backgroundColor: colors.surface,
        borderRadius: template.features.roundedCorners === 'none' ? '0' : '1rem',
      }}
    >
      {/* Image Container */}
      <Link 
        href={`/${locale}/article/${article.slug}`}
        className="relative block aspect-[3/4] overflow-hidden"
      >
        {article.image ? (
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div 
            className="w-full h-full"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
            }}
          />
        )}
        
        {/* Gradient Overlay */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.9) 100%)',
          }}
        />

        {/* Arrow indicator */}
        <div 
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ArrowUpRight className="w-5 h-5 text-white" />
        </div>
      </Link>

      {/* Content Overlay - Bottom */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        {/* Category Badge */}
        {showCategory && features.categoryBadges && article.category && (
          <span 
            className="inline-block px-3 py-1 text-xs font-black uppercase tracking-widest mb-3"
            style={{ 
              backgroundColor: colors.accent,
              color: 'white',
              borderRadius: '2rem',
            }}
          >
            {article.category}
          </span>
        )}

        <Link href={`/${locale}/article/${article.slug}`}>
          <h3 
            className="text-xl md:text-2xl font-black line-clamp-3 text-white mb-3 leading-tight"
            style={{ 
              fontFamily: template.typography.headingFont,
            }}
          >
            {article.title}
          </h3>
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-white/70">
          {showAuthor && features.showAuthor && article.author && (
            <span className="flex items-center gap-1 font-medium">
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
        </div>
      </div>

      {/* Hover effect border */}
      <div 
        className="absolute inset-0 border-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ 
          borderColor: colors.accent,
          borderRadius: template.features.roundedCorners === 'none' ? '0' : '1rem',
        }}
      />
    </article>
  );
}
