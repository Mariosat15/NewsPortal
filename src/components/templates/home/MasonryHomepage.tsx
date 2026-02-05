'use client';

import Link from 'next/link';
import Image from 'next/image';
import { HomeLayoutProps } from '@/lib/templates/types';
import { 
  getSpacingScale, 
  getBorderRadius, 
  getShadow,
  getColorWithOpacity,
} from '@/lib/templates/utils';
import { Flame, Clock, ChevronDown, Eye } from 'lucide-react';

export function MasonryHomepage({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;
  const spacing = getSpacingScale(template);
  const borderRadius = getBorderRadius(template, 'lg');
  const shadow = getShadow(template, 'medium');

  // Article distribution for masonry layout
  const heroArticle = articles[0];
  const featuredArticles = articles.slice(1, 6); // 5 featured bento items
  const masonryArticles = articles.slice(6, 42); // Up to 36 articles for masonry
  
  // Distribute into 4 columns for varied heights
  const col1 = masonryArticles.filter((_, i) => i % 4 === 0);
  const col2 = masonryArticles.filter((_, i) => i % 4 === 1);
  const col3 = masonryArticles.filter((_, i) => i % 4 === 2);
  const col4 = masonryArticles.filter((_, i) => i % 4 === 3);

  // Get category display name
  const getCategoryName = (slug: string) => {
    const category = categories.find(c => c.slug === slug);
    return category?.displayName?.[locale as 'de' | 'en'] || category?.displayName?.de || slug;
  };

  // Varied aspect ratios for visual interest
  const getAspectClass = (idx: number): string => {
    const patterns = ['aspect-[3/4]', 'aspect-square', 'aspect-[4/5]', 'aspect-[3/4]', 'aspect-[5/6]'];
    return patterns[idx % patterns.length];
  };

  return (
    <div style={{ backgroundColor: colors.background }}>
      {/* FULL WIDTH HERO */}
      {heroArticle && (
        <section className="relative h-[60vh] min-h-[450px] max-h-[700px]">
          <Image
            src={heroArticle.image || heroArticle.thumbnail || '/images/placeholder.jpg'}
            alt={heroArticle.title}
            fill
            className="object-cover"
            priority
          />
          <div 
            className="absolute inset-0"
            style={{ 
              background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.2) 100%)',
            }}
          />
          
          {/* Hero Content */}
          <div 
            className="absolute inset-x-0 bottom-0 px-4 pb-8 md:pb-12"
            style={{ maxWidth: template.spacing.containerMax, margin: '0 auto' }}
          >
            <div className="max-w-3xl">
              {heroArticle.category && (
                <span 
                  className="inline-block px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white mb-4"
                  style={{ 
                    backgroundColor: colors.accent,
                    borderRadius: getBorderRadius(template, 'sm'),
                  }}
                >
                  {getCategoryName(heroArticle.category)}
                </span>
              )}
              <Link href={`/${locale}/article/${heroArticle.slug}`}>
                <h1 
                  className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-[1.1] hover:underline decoration-2 underline-offset-4"
                  style={{ fontFamily: template.typography.headingFont }}
                >
                  {heroArticle.title}
                </h1>
              </Link>
              <p 
                className="text-base md:text-lg text-white/75 mb-5 max-w-2xl hidden md:block leading-relaxed"
                style={{ fontFamily: template.typography.bodyFont }}
              >
                {heroArticle.excerpt || heroArticle.teaser}
              </p>
              <div className="flex items-center gap-5 text-sm text-white/60">
                {heroArticle.author && (
                  <span className="font-semibold text-white">{heroArticle.author}</span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {heroArticle.date}
                </span>
                {heroArticle.readingTime && (
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    {heroArticle.readingTime} min
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <div 
        className="mx-auto px-4"
        style={{ 
          maxWidth: template.spacing.containerMax,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xl,
        }}
      >
        {/* FEATURED BENTO GRID */}
        <section style={{ marginBottom: spacing['2xl'] }}>
          <div className="flex items-center gap-3 mb-6">
            <Flame className="w-5 h-5" style={{ color: colors.accent }} />
            <h2 
              className="text-xl font-black uppercase tracking-tight"
              style={{ fontFamily: template.typography.headingFont, color: colors.text }}
            >
              {locale === 'de' ? 'Im Trend' : 'Trending Now'}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: spacing.md }}>
            {featuredArticles.map((article, idx) => (
              <Link
                key={article.slug}
                href={`/${locale}/article/${article.slug}`}
                className={`group relative overflow-hidden transition-all duration-300 ${
                  idx === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-[4/5]'
                }`}
                style={{ borderRadius }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Image
                  src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div 
                  className="absolute inset-0"
                  style={{ 
                    background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.9) 100%)',
                  }}
                />
                
                {article.category && (
                  <span 
                    className="absolute top-3 left-3 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white"
                    style={{ 
                      backgroundColor: colors.accent,
                      borderRadius: getBorderRadius(template, 'sm'),
                    }}
                  >
                    {getCategoryName(article.category)}
                  </span>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 
                    className={`font-bold text-white leading-tight line-clamp-2 ${
                      idx === 0 ? 'text-lg md:text-2xl' : 'text-sm'
                    }`}
                    style={{ fontFamily: template.typography.headingFont }}
                  >
                    {article.title}
                  </h3>
                  {idx === 0 && (
                    <p className="text-white/60 text-sm mt-2">{article.date}</p>
                  )}
                </div>
                
                {/* Hover accent overlay */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ 
                    background: `linear-gradient(135deg, ${getColorWithOpacity(colors.accent, 0.3)} 0%, transparent 100%)`,
                  }}
                />
              </Link>
            ))}
          </div>
        </section>

        {/* Section Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div 
            className="flex-1 h-px"
            style={{ backgroundColor: colors.border }}
          />
          <h2 
            className="text-xs font-black uppercase tracking-[0.2em]"
            style={{ color: colors.textMuted }}
          >
            {locale === 'de' ? 'Alle Geschichten' : 'All Stories'}
          </h2>
          <div 
            className="flex-1 h-px"
            style={{ backgroundColor: colors.border }}
          />
        </div>

        {/* MASONRY GRID - Desktop */}
        <div 
          className="hidden md:grid grid-cols-4"
          style={{ gap: spacing.lg }}
        >
          {/* Column 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
            {col1.map((article, i) => (
              <MasonryCard 
                key={article.slug}
                article={article}
                template={template}
                locale={locale}
                colors={colors}
                spacing={spacing}
                aspectClass={getAspectClass(i)}
                getCategoryName={getCategoryName}
              />
            ))}
          </div>

          {/* Column 2 - Offset */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, marginTop: spacing.xl }}>
            {col2.map((article, i) => (
              <MasonryCard 
                key={article.slug}
                article={article}
                template={template}
                locale={locale}
                colors={colors}
                spacing={spacing}
                aspectClass={getAspectClass(i + 1)}
                getCategoryName={getCategoryName}
              />
            ))}
          </div>

          {/* Column 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, marginTop: spacing.md }}>
            {col3.map((article, i) => (
              <MasonryCard 
                key={article.slug}
                article={article}
                template={template}
                locale={locale}
                colors={colors}
                spacing={spacing}
                aspectClass={getAspectClass(i + 2)}
                getCategoryName={getCategoryName}
              />
            ))}
          </div>

          {/* Column 4 - Offset */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, marginTop: spacing['2xl'] }}>
            {col4.map((article, i) => (
              <MasonryCard 
                key={article.slug}
                article={article}
                template={template}
                locale={locale}
                colors={colors}
                spacing={spacing}
                aspectClass={getAspectClass(i + 3)}
                getCategoryName={getCategoryName}
              />
            ))}
          </div>
        </div>

        {/* Mobile Grid */}
        <div 
          className="md:hidden grid grid-cols-2"
          style={{ gap: spacing.md }}
        >
          {masonryArticles.slice(0, 16).map((article, i) => (
            <MasonryCard 
              key={article.slug}
              article={article}
              template={template}
              locale={locale}
              colors={colors}
              spacing={spacing}
              aspectClass={getAspectClass(i)}
              getCategoryName={getCategoryName}
            />
          ))}
        </div>

        {/* Load More Button */}
        {articles.length >= 20 && (
          <div className="text-center" style={{ marginTop: spacing.xl }}>
            <button
              className="inline-flex items-center gap-2 px-10 py-3.5 font-black uppercase tracking-wider text-sm transition-all"
              style={{ 
                backgroundColor: colors.text,
                color: colors.background,
                borderRadius: getBorderRadius(template, 'full'),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = getShadow(template, 'strong');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {locale === 'de' ? 'Mehr laden' : 'Load More'}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Masonry Card Component
interface MasonryCardProps {
  article: HomeLayoutProps['articles'][0];
  template: HomeLayoutProps['template'];
  locale: string;
  colors: ReturnType<typeof getSpacingScale> extends never ? never : {
    accent: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
  };
  spacing: ReturnType<typeof getSpacingScale>;
  aspectClass: string;
  getCategoryName: (slug: string) => string;
}

function MasonryCard({ 
  article, 
  template, 
  locale, 
  colors, 
  spacing, 
  aspectClass,
  getCategoryName,
}: MasonryCardProps) {
  const borderRadius = getBorderRadius(template, 'lg');
  const shadow = getShadow(template, 'medium');
  
  return (
    <Link
      href={`/${locale}/article/${article.slug}`}
      className={`group relative block overflow-hidden transition-all duration-300 ${aspectClass}`}
      style={{ 
        borderRadius,
        boxShadow: shadow,
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
      <Image
        src={article.image || article.thumbnail || '/images/placeholder.jpg'}
        alt={article.title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)',
        }}
      />
      
      {article.category && (
        <span 
          className="absolute top-3 left-3 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white"
          style={{ 
            backgroundColor: colors.accent,
            borderRadius: getBorderRadius(template, 'sm'),
          }}
        >
          {getCategoryName(article.category)}
        </span>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 
          className="text-sm font-bold text-white leading-snug line-clamp-2"
          style={{ fontFamily: template.typography.headingFont }}
        >
          {article.title}
        </h3>
        <p className="text-white/60 text-[11px] mt-2">{article.date}</p>
      </div>
    </Link>
  );
}
