'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { HomeLayoutProps } from '@/lib/templates/types';
import { 
  getSpacingScale, 
  getBorderRadius, 
  getShadow,
  getColorWithOpacity,
} from '@/lib/templates/utils';
import { Grid, List, ChevronDown } from 'lucide-react';

export function GridHomepage({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;
  const spacing = getSpacingScale(template);
  const borderRadius = getBorderRadius(template, 'lg');
  const shadow = getShadow(template, 'medium');
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter articles by category
  const filteredArticles = activeCategory === 'all' 
    ? articles 
    : articles.filter(a => a.category === activeCategory);

  // Get category display name
  const getCategoryName = (slug: string) => {
    const category = categories.find(c => c.slug === slug);
    return category?.displayName?.[locale as 'de' | 'en'] || category?.displayName?.de || slug;
  };

  // Featured articles (first 2)
  const featuredArticles = filteredArticles.slice(0, 2);
  // Regular grid articles
  const gridArticles = filteredArticles.slice(2);

  return (
    <div style={{ backgroundColor: colors.background, minHeight: '100vh' }}>
      {/* Sticky Filter Bar */}
      <div 
        className="sticky top-0 z-20"
        style={{ 
          backgroundColor: getColorWithOpacity(colors.background, 0.95),
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div 
          className="mx-auto px-4"
          style={{ 
            maxWidth: template.spacing.containerMax,
            paddingTop: spacing.md,
            paddingBottom: spacing.md,
          }}
        >
          <div className="flex items-center justify-between">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1 mr-4">
              <button
                onClick={() => setActiveCategory('all')}
                className="shrink-0 px-4 py-2 text-sm font-semibold transition-all duration-200"
                style={{ 
                  backgroundColor: activeCategory === 'all' ? colors.accent : 'transparent',
                  color: activeCategory === 'all' ? 'white' : colors.text,
                  borderRadius: getBorderRadius(template, 'full'),
                  border: activeCategory === 'all' ? 'none' : `1px solid ${colors.border}`,
                }}
              >
                {locale === 'de' ? 'Alle' : 'All'}
              </button>
              {categories.filter(c => c.enabled).slice(0, 10).map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug)}
                  className="shrink-0 px-4 py-2 text-sm font-semibold transition-all duration-200"
                  style={{ 
                    backgroundColor: activeCategory === cat.slug ? colors.accent : 'transparent',
                    color: activeCategory === cat.slug ? 'white' : colors.text,
                    borderRadius: getBorderRadius(template, 'full'),
                    border: activeCategory === cat.slug ? 'none' : `1px solid ${colors.border}`,
                  }}
                >
                  {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div 
              className="flex items-center shrink-0"
              style={{ 
                backgroundColor: colors.surfaceAlt,
                borderRadius: getBorderRadius(template, 'md'),
                padding: '4px',
              }}
            >
              <button
                onClick={() => setViewMode('grid')}
                className="p-2 transition-colors"
                style={{
                  backgroundColor: viewMode === 'grid' ? colors.surface : 'transparent',
                  borderRadius: getBorderRadius(template, 'sm'),
                  color: viewMode === 'grid' ? colors.accent : colors.textMuted,
                }}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="p-2 transition-colors"
                style={{
                  backgroundColor: viewMode === 'list' ? colors.surface : 'transparent',
                  borderRadius: getBorderRadius(template, 'sm'),
                  color: viewMode === 'list' ? colors.accent : colors.textMuted,
                }}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div 
        className="mx-auto px-4"
        style={{ 
          maxWidth: template.spacing.containerMax,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xl,
        }}
      >
        {/* Featured Section - 2 Large Cards */}
        {featuredArticles.length > 0 && (
          <div 
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ gap: spacing.lg, marginBottom: spacing.xl }}
          >
            {featuredArticles.map((article, idx) => (
              <Link
                key={article.slug}
                href={`/${locale}/article/${article.slug}`}
                className="group relative block aspect-[16/10] overflow-hidden"
                style={{ borderRadius }}
              >
                <Image
                  src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority={idx === 0}
                />
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                  }}
                />
                
                {article.category && (
                  <span 
                    className="absolute top-4 left-4 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white"
                    style={{ 
                      backgroundColor: colors.accent,
                      borderRadius: getBorderRadius(template, 'sm'),
                    }}
                  >
                    {getCategoryName(article.category)}
                  </span>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 
                    className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-white/90"
                    style={{ fontFamily: template.typography.headingFont }}
                  >
                    {article.title}
                  </h2>
                  <p className="text-white/70 text-sm line-clamp-2 mb-3 max-w-lg">
                    {article.excerpt || article.teaser}
                  </p>
                  <p className="text-white/50 text-xs">{article.date}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Main Grid / List */}
        {viewMode === 'grid' ? (
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            style={{ gap: spacing.lg }}
          >
            {gridArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/${locale}/article/${article.slug}`}
                className="group block overflow-hidden transition-all duration-300"
                style={{ 
                  backgroundColor: colors.surface,
                  borderRadius,
                  boxShadow: shadow,
                  border: `1px solid ${colors.border}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = getShadow(template, 'strong');
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = shadow;
                }}
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {article.category && (
                    <span 
                      className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                      style={{ 
                        backgroundColor: colors.accent,
                        borderRadius: getBorderRadius(template, 'sm'),
                      }}
                    >
                      {getCategoryName(article.category)}
                    </span>
                  )}
                </div>
                <div style={{ padding: spacing.md }}>
                  <h3 
                    className="text-base font-bold line-clamp-2 leading-snug mb-2"
                    style={{ 
                      color: colors.text,
                      fontFamily: template.typography.headingFont,
                    }}
                  >
                    {article.title}
                  </h3>
                  <p 
                    className="text-sm line-clamp-2 mb-3"
                    style={{ color: colors.textMuted }}
                  >
                    {article.excerpt || article.teaser}
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: colors.textMuted }}
                  >
                    {article.date}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* List View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {gridArticles.map((article, idx) => (
              <Link
                key={article.slug}
                href={`/${locale}/article/${article.slug}`}
                className="group flex gap-5 p-4 transition-all duration-200"
                style={{ 
                  backgroundColor: colors.surface,
                  borderRadius,
                  border: `1px solid ${colors.border}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.surfaceAlt;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.surface;
                }}
              >
                <div 
                  className="relative shrink-0 w-40 h-28 overflow-hidden"
                  style={{ borderRadius: getBorderRadius(template, 'md') }}
                >
                  <Image
                    src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex-1 min-w-0 py-1">
                  {article.category && (
                    <span 
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: colors.accent }}
                    >
                      {getCategoryName(article.category)}
                    </span>
                  )}
                  <h3 
                    className="text-lg font-bold line-clamp-2 leading-snug mt-1 group-hover:underline"
                    style={{ 
                      color: colors.text,
                      fontFamily: template.typography.headingFont,
                    }}
                  >
                    {article.title}
                  </h3>
                  <p 
                    className="text-sm line-clamp-2 mt-2"
                    style={{ color: colors.textMuted }}
                  >
                    {article.excerpt || article.teaser}
                  </p>
                  <p 
                    className="text-xs mt-2"
                    style={{ color: colors.textMuted }}
                  >
                    {article.date}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {filteredArticles.length >= 16 && (
          <div className="text-center" style={{ marginTop: spacing.xl }}>
            <button
              className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold transition-all duration-200"
              style={{ 
                backgroundColor: colors.accent,
                color: 'white',
                borderRadius: getBorderRadius(template, 'full'),
                boxShadow: getShadow(template, 'medium'),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = getShadow(template, 'strong');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = getShadow(template, 'medium');
              }}
            >
              {locale === 'de' ? 'Mehr laden' : 'Load More'}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* No Results */}
        {filteredArticles.length === 0 && (
          <div 
            className="text-center py-20"
            style={{ backgroundColor: colors.surfaceAlt, borderRadius }}
          >
            <p className="text-lg" style={{ color: colors.textMuted }}>
              {locale === 'de' 
                ? 'Keine Artikel in dieser Kategorie gefunden.'
                : 'No articles found in this category.'}
            </p>
            <button
              onClick={() => setActiveCategory('all')}
              className="mt-4 px-6 py-2 text-sm font-semibold"
              style={{ 
                backgroundColor: colors.accent,
                color: 'white',
                borderRadius: getBorderRadius(template, 'full'),
              }}
            >
              {locale === 'de' ? 'Alle Artikel anzeigen' : 'Show all articles'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
