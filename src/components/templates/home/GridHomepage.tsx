'use client';

import Link from 'next/link';
import Image from 'next/image';
import { HomeLayoutProps } from '@/lib/templates/types';
import { getCardComponent } from '../cards';
import { useState } from 'react';

export function GridHomepage({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;
  const CardComponent = getCardComponent(template.layout.articleCard);
  const [activeCategory, setActiveCategory] = useState('all');

  // Filter articles by category
  const filteredArticles = activeCategory === 'all' 
    ? articles 
    : articles.filter(a => a.category === activeCategory);

  return (
    <div className="py-8">
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Category Filter Bar - Sticky */}
        <div 
          className="sticky top-0 z-10 -mx-4 px-4 py-4"
          style={{ backgroundColor: colors.background }}
        >
          <div 
            className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide"
          >
            <button
              onClick={() => setActiveCategory('all')}
              className="shrink-0 px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-200"
              style={{ 
                backgroundColor: activeCategory === 'all' ? colors.accent : colors.surfaceAlt,
                color: activeCategory === 'all' ? 'white' : colors.text,
                boxShadow: activeCategory === 'all' ? '0 4px 14px -3px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {locale === 'de' ? 'Alle' : 'All'}
            </button>
            {categories.filter(c => c.enabled).slice(0, 8).map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className="shrink-0 px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-200"
                style={{ 
                  backgroundColor: activeCategory === cat.slug ? colors.accent : colors.surfaceAlt,
                  color: activeCategory === cat.slug ? 'white' : colors.text,
                  boxShadow: activeCategory === cat.slug ? '0 4px 14px -3px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
              </button>
            ))}
          </div>
        </div>

        {/* Grid with varied sizes for first few items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArticles.map((article, idx) => {
            // First two articles are featured (larger)
            if (idx < 2) {
              return (
                <Link
                  key={article.slug}
                  href={`/${locale}/article/${article.slug}`}
                  className={`group relative overflow-hidden rounded-xl ${idx === 0 ? 'sm:col-span-2 lg:row-span-2' : 'sm:col-span-1 lg:row-span-2'}`}
                  style={{ minHeight: idx === 0 ? '400px' : '350px' }}
                >
                  <Image
                    src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority={idx === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  {article.category && (
                    <span 
                      className="absolute top-4 left-4 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white rounded"
                      style={{ backgroundColor: colors.accent }}
                    >
                      {article.category}
                    </span>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h2 
                      className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-3"
                      style={{ fontFamily: template.typography.headingFont }}
                    >
                      {article.title}
                    </h2>
                    <p className="text-white/70 text-sm line-clamp-2 mb-3">
                      {article.excerpt || article.teaser}
                    </p>
                    <p className="text-white/50 text-xs">{article.date}</p>
                  </div>
                </Link>
              );
            }

            // Regular grid items
            return (
              <CardComponent
                key={article.slug}
                article={article}
                template={template}
                locale={locale}
              />
            );
          })}
        </div>

        {/* Load More */}
        {filteredArticles.length >= 12 && (
          <div className="text-center mt-12">
            <button
              className="px-10 py-3.5 text-sm font-bold rounded-full transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: colors.accent,
                color: 'white',
                boxShadow: '0 4px 14px -3px rgba(0,0,0,0.25)',
              }}
            >
              {locale === 'de' ? 'Mehr laden' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
