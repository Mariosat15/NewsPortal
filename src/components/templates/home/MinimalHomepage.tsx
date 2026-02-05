'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, User, ChevronDown } from 'lucide-react';
import { HomeLayoutProps } from '@/lib/templates/types';
import { 
  getSpacingScale, 
  getBorderRadius,
  getColorWithOpacity,
} from '@/lib/templates/utils';

export function MinimalHomepage({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;
  const spacing = getSpacingScale(template);
  
  // More content for minimal layout
  const featuredArticle = articles[0];
  const secondaryFeatured = articles.slice(1, 4); // 3 secondary
  const remainingArticles = articles.slice(4, 20); // 16 more

  // Get category display name
  const getCategoryName = (slug: string) => {
    const category = categories.find(c => c.slug === slug);
    return category?.displayName?.[locale as 'de' | 'en'] || category?.displayName?.de || slug;
  };

  return (
    <div style={{ backgroundColor: colors.background }}>
      {/* Main Container - Narrow for readability */}
      <div 
        className="mx-auto px-4"
        style={{ 
          maxWidth: '780px',
          paddingTop: spacing['2xl'],
          paddingBottom: spacing['2xl'],
        }}
      >
        {/* Elegant Header */}
        <header className="text-center" style={{ marginBottom: spacing['2xl'] }}>
          <p 
            className="text-xs uppercase tracking-[0.35em] mb-4"
            style={{ color: colors.textMuted }}
          >
            {new Date().toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <h1 
            className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
            style={{ 
              fontFamily: template.typography.headingFont,
              fontWeight: template.typography.headingWeight,
              color: colors.text,
            }}
          >
            {locale === 'de' ? 'Neueste Artikel' : 'Latest Articles'}
          </h1>
          <div 
            className="w-20 h-0.5 mx-auto"
            style={{ backgroundColor: colors.accent }}
          />
        </header>

        {/* Category Pills */}
        <div 
          className="flex flex-wrap justify-center"
          style={{ gap: spacing.sm, marginBottom: spacing['2xl'] }}
        >
          <Link
            href={`/${locale}`}
            className="px-5 py-2 text-sm font-medium transition-all"
            style={{ 
              backgroundColor: colors.accent,
              color: 'white',
              borderRadius: getBorderRadius(template, 'full'),
            }}
          >
            {locale === 'de' ? 'Alle' : 'All'}
          </Link>
          {categories.filter(c => c.enabled).slice(0, 12).map((cat) => (
            <Link
              key={cat.slug}
              href={`/${locale}/categories/${cat.slug}`}
              className="px-5 py-2 text-sm font-medium transition-all"
              style={{ 
                border: `1px solid ${colors.border}`,
                color: colors.text,
                borderRadius: getBorderRadius(template, 'full'),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = getColorWithOpacity(colors.accent, 0.1);
                e.currentTarget.style.borderColor = colors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
            </Link>
          ))}
        </div>

        {/* Featured Article - Large */}
        {featuredArticle && (
          <article 
            style={{ 
              marginBottom: spacing['2xl'],
              paddingBottom: spacing.xl,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            <Link 
              href={`/${locale}/article/${featuredArticle.slug}`}
              className="group block"
            >
              {(featuredArticle.image || featuredArticle.thumbnail) && (
                <div 
                  className="relative aspect-[16/9] mb-8 overflow-hidden"
                  style={{ borderRadius: getBorderRadius(template, 'sm') }}
                >
                  <Image
                    src={featuredArticle.image || featuredArticle.thumbnail || ''}
                    alt={featuredArticle.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    priority
                  />
                </div>
              )}
              
              {featuredArticle.category && (
                <span 
                  className="text-xs font-semibold uppercase tracking-[0.15em] mb-4 block"
                  style={{ color: colors.accent }}
                >
                  {getCategoryName(featuredArticle.category)}
                </span>
              )}
              
              <h2 
                className="text-3xl md:text-4xl font-bold mb-5 leading-[1.15] group-hover:underline decoration-2 underline-offset-4"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  fontWeight: template.typography.headingWeight,
                  color: colors.text,
                }}
              >
                {featuredArticle.title}
              </h2>
              
              {(featuredArticle.excerpt || featuredArticle.teaser) && (
                <p 
                  className="text-lg leading-relaxed mb-6"
                  style={{ 
                    fontFamily: template.typography.bodyFont,
                    color: colors.textMuted,
                  }}
                >
                  {featuredArticle.excerpt || featuredArticle.teaser}
                </p>
              )}
              
              <div 
                className="flex items-center gap-4 text-sm"
                style={{ color: colors.textMuted }}
              >
                {featuredArticle.author && (
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{featuredArticle.author}</span>
                  </span>
                )}
                {featuredArticle.date && <span>{featuredArticle.date}</span>}
                {featuredArticle.readingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {featuredArticle.readingTime} min
                  </span>
                )}
              </div>
            </Link>
          </article>
        )}

        {/* Secondary Featured - 3 Cards with Images */}
        {secondaryFeatured.length > 0 && (
          <div 
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ 
              gap: spacing.lg, 
              marginBottom: spacing['2xl'],
              paddingBottom: spacing.xl,
              borderBottom: `1px solid ${colors.border}`,
            }}
          >
            {secondaryFeatured.map((article) => (
              <Link
                key={article.slug}
                href={`/${locale}/article/${article.slug}`}
                className="group block"
              >
                <div 
                  className="relative aspect-[4/3] mb-4 overflow-hidden"
                  style={{ borderRadius: getBorderRadius(template, 'sm') }}
                >
                  <Image
                    src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                {article.category && (
                  <span 
                    className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-2 block"
                    style={{ color: colors.accent }}
                  >
                    {getCategoryName(article.category)}
                  </span>
                )}
                <h3 
                  className="text-base font-bold leading-snug line-clamp-2 group-hover:underline"
                  style={{ 
                    fontFamily: template.typography.headingFont,
                    color: colors.text,
                  }}
                >
                  {article.title}
                </h3>
                <p 
                  className="text-xs mt-2"
                  style={{ color: colors.textMuted }}
                >
                  {article.date}
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Article List - Clean, Text-focused */}
        <div>
          {remainingArticles.map((article, index) => (
            <article 
              key={article.slug}
              className="group"
              style={{ 
                paddingTop: spacing.lg,
                paddingBottom: spacing.lg,
                borderBottom: index < remainingArticles.length - 1 ? `1px solid ${colors.border}` : 'none',
              }}
            >
              <div className="flex gap-6">
                {/* Number */}
                <span 
                  className="text-4xl font-bold leading-none shrink-0 w-12 hidden md:block"
                  style={{ 
                    fontFamily: template.typography.headingFont,
                    color: getColorWithOpacity(colors.accent, 0.15),
                  }}
                >
                  {String(index + 5).padStart(2, '0')}
                </span>
                
                <div className="flex-1">
                  {/* Category & Date */}
                  <div className="flex items-center gap-3 mb-2">
                    {article.category && (
                      <span 
                        className="text-[10px] font-semibold uppercase tracking-[0.15em]"
                        style={{ color: colors.accent }}
                      >
                        {getCategoryName(article.category)}
                      </span>
                    )}
                    {article.date && (
                      <>
                        <span style={{ color: colors.border }}>·</span>
                        <span 
                          className="text-[11px]"
                          style={{ color: colors.textMuted }}
                        >
                          {article.date}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <Link href={`/${locale}/article/${article.slug}`}>
                    <h2 
                      className="text-lg md:text-xl font-bold mb-2 leading-snug group-hover:underline decoration-1 underline-offset-4"
                      style={{ 
                        fontFamily: template.typography.headingFont,
                        fontWeight: template.typography.headingWeight,
                        color: colors.text,
                      }}
                    >
                      {article.title}
                    </h2>
                  </Link>

                  {/* Excerpt */}
                  {(article.excerpt || article.teaser) && (
                    <p 
                      className="text-sm leading-relaxed mb-3 line-clamp-2"
                      style={{ 
                        fontFamily: template.typography.bodyFont,
                        color: colors.textMuted,
                      }}
                    >
                      {article.excerpt || article.teaser}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-4 text-xs"
                      style={{ color: colors.textMuted }}
                    >
                      {article.author && (
                        <span className="font-medium">{article.author}</span>
                      )}
                      {article.readingTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {article.readingTime} min
                        </span>
                      )}
                    </div>

                    <Link 
                      href={`/${locale}/article/${article.slug}`}
                      className="flex items-center gap-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: colors.accent }}
                    >
                      {locale === 'de' ? 'Lesen' : 'Read'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load More */}
        {articles.length >= 12 && (
          <div className="text-center" style={{ marginTop: spacing.xl }}>
            <button
              className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium tracking-wide transition-all"
              style={{ 
                border: `2px solid ${colors.text}`,
                color: colors.text,
                borderRadius: getBorderRadius(template, 'full'),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.text;
                e.currentTarget.style.color = colors.background;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text;
              }}
            >
              {locale === 'de' ? 'Mehr Artikel laden' : 'Load more articles'}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
