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
import { Sparkles, ArrowRight, Tag, Bell, ChevronRight, TrendingUp, Clock } from 'lucide-react';

export function CardsHomepage({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;
  const spacing = getSpacingScale(template);
  const borderRadius = getBorderRadius(template, 'lg');
  const shadow = getShadow(template, 'medium');
  
  // Extended article distribution for more content
  const heroArticle = articles[0];
  const sideFeatured = articles.slice(1, 4); // 3 side articles
  const featuredRow = articles.slice(4, 10); // 6 featured cards
  const latestArticles = articles.slice(10, 22); // 12 latest
  const trendingArticles = articles.slice(0, 8); // Top 8 for trending
  const moreArticles = articles.slice(22, 38); // 16 more articles

  // Get category display name
  const getCategoryName = (slug: string) => {
    const category = categories.find(c => c.slug === slug);
    return category?.displayName?.[locale as 'de' | 'en'] || category?.displayName?.de || slug;
  };

  return (
    <div style={{ backgroundColor: colors.background }}>
      <div 
        className="mx-auto px-4"
        style={{ 
          maxWidth: template.spacing.containerMax,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xl,
        }}
      >
        {/* HERO SECTION - Large Hero + Side Stack */}
        <section style={{ marginBottom: spacing['2xl'] }}>
          <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: spacing.lg }}>
            {/* Main Hero */}
            {heroArticle && (
              <div className="lg:col-span-2">
                <Link
                  href={`/${locale}/article/${heroArticle.slug}`}
                  className="group relative block aspect-[16/10] overflow-hidden"
                  style={{ borderRadius }}
                >
                  <Image
                    src={heroArticle.image || heroArticle.thumbnail || '/images/placeholder.jpg'}
                    alt={heroArticle.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                    }}
                  />
                  
                  {heroArticle.category && (
                    <span 
                      className="absolute top-4 left-4 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white"
                      style={{ 
                        backgroundColor: colors.accent,
                        borderRadius: getBorderRadius(template, 'full'),
                      }}
                    >
                      {getCategoryName(heroArticle.category)}
                    </span>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <h2 
                      className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-white/90"
                      style={{ fontFamily: template.typography.headingFont }}
                    >
                      {heroArticle.title}
                    </h2>
                    <p className="text-white/70 text-sm md:text-base line-clamp-2 mb-4 max-w-2xl hidden md:block">
                      {heroArticle.excerpt || heroArticle.teaser}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      {heroArticle.author && <span>{heroArticle.author}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {heroArticle.date}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Side Featured Stack - Stacked Cards Effect */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {sideFeatured.map((article, idx) => (
                <Link
                  key={article.slug}
                  href={`/${locale}/article/${article.slug}`}
                  className="group relative block aspect-[2/1] overflow-hidden transition-all duration-300"
                  style={{ 
                    borderRadius: getBorderRadius(template, 'md'),
                    boxShadow: shadow,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
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
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                    }}
                  />
                  
                  {article.category && (
                    <span 
                      className="absolute top-3 left-3 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white"
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
                      className="text-sm md:text-base font-bold text-white line-clamp-2 leading-snug"
                      style={{ fontFamily: template.typography.headingFont }}
                    >
                      {article.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED CARDS ROW */}
        <section style={{ marginBottom: spacing['2xl'] }}>
          <div 
            className="flex items-center justify-between mb-6 pb-4"
            style={{ borderBottom: `2px solid ${colors.accent}` }}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" style={{ color: colors.accent }} />
              <h2 
                className="text-lg font-bold"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  color: colors.text,
                }}
              >
                {locale === 'de' ? 'Ausgewählte Artikel' : 'Featured Stories'}
              </h2>
            </div>
            <Link
              href={`/${locale}`}
              className="flex items-center gap-1 text-sm font-medium hover:underline"
              style={{ color: colors.accent }}
            >
              {locale === 'de' ? 'Alle anzeigen' : 'View all'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
            style={{ gap: spacing.md }}
          >
            {featuredRow.map((article) => (
              <Link
                key={article.slug}
                href={`/${locale}/article/${article.slug}`}
                className="group block transition-all duration-300"
                style={{ 
                  backgroundColor: colors.surface,
                  borderRadius: getBorderRadius(template, 'md'),
                  overflow: 'hidden',
                  border: `1px solid ${colors.border}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = getShadow(template, 'strong');
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {article.category && (
                    <span 
                      className="absolute top-2 left-2 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white"
                      style={{ 
                        backgroundColor: colors.accent,
                        borderRadius: getBorderRadius(template, 'sm'),
                      }}
                    >
                      {getCategoryName(article.category)}
                    </span>
                  )}
                </div>
                <div style={{ padding: spacing.sm }}>
                  <h3 
                    className="text-xs font-bold line-clamp-2 leading-snug"
                    style={{ color: colors.text }}
                  >
                    {article.title}
                  </h3>
                  <p 
                    className="text-[10px] mt-1.5"
                    style={{ color: colors.textMuted }}
                  >
                    {article.date}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* THREE COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: spacing.xl }}>
          {/* Latest Articles - Main Column */}
          <div className="lg:col-span-8">
            <div 
              className="flex items-center justify-between mb-6 pb-4"
              style={{ borderBottom: `2px solid ${colors.accent}` }}
            >
              <h2 
                className="text-lg font-bold"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  color: colors.text,
                }}
              >
                {locale === 'de' ? 'Neueste Nachrichten' : 'Latest News'}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {latestArticles.map((article, idx) => (
                <Link
                  key={article.slug}
                  href={`/${locale}/article/${article.slug}`}
                  className="group flex gap-4 transition-all duration-200"
                  style={{
                    padding: spacing.md,
                    backgroundColor: colors.surface,
                    borderRadius: getBorderRadius(template, 'md'),
                    border: `1px solid ${colors.border}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.surfaceAlt;
                    e.currentTarget.style.boxShadow = getShadow(template, 'subtle');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.surface;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div 
                    className="relative shrink-0 w-28 h-20 md:w-36 md:h-24 overflow-hidden"
                    style={{ borderRadius: getBorderRadius(template, 'sm') }}
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
                      className="text-sm md:text-base font-bold line-clamp-2 leading-snug mt-1 group-hover:underline"
                      style={{ 
                        color: colors.text,
                        fontFamily: template.typography.headingFont,
                      }}
                    >
                      {article.title}
                    </h3>
                    <p 
                      className="text-xs line-clamp-1 mt-2 hidden md:block"
                      style={{ color: colors.textMuted }}
                    >
                      {article.excerpt || article.teaser}
                    </p>
                    <p 
                      className="text-[11px] mt-2"
                      style={{ color: colors.textMuted }}
                    >
                      {article.date}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
            {/* Trending Section */}
            <div 
              style={{ 
                backgroundColor: colors.surface,
                borderRadius,
                padding: spacing.lg,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div 
                className="flex items-center gap-2 mb-5 pb-3"
                style={{ borderBottom: `2px solid ${colors.accent}` }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: colors.accent }} />
                <h3 
                  className="text-sm font-bold uppercase tracking-wide"
                  style={{ color: colors.text }}
                >
                  Trending
                </h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                {trendingArticles.slice(0, 6).map((article, idx) => (
                  <Link
                    key={article.slug}
                    href={`/${locale}/article/${article.slug}`}
                    className="group flex items-start gap-3"
                  >
                    <span 
                      className="text-xl font-black leading-none w-6 shrink-0"
                      style={{ color: getColorWithOpacity(colors.accent, 0.25) }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 
                        className="text-[13px] font-semibold line-clamp-2 leading-snug group-hover:underline"
                        style={{ color: colors.text }}
                      >
                        {article.title}
                      </h4>
                      <p className="text-[10px] mt-1" style={{ color: colors.textMuted }}>
                        {article.date}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div 
              style={{ 
                backgroundColor: colors.surfaceAlt,
                borderRadius,
                padding: spacing.lg,
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <Tag className="w-4 h-4" style={{ color: colors.accent }} />
                <h3 
                  className="text-sm font-bold uppercase tracking-wide"
                  style={{ color: colors.text }}
                >
                  {locale === 'de' ? 'Kategorien' : 'Categories'}
                </h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                {categories.filter(c => c.enabled).slice(0, 20).map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/${locale}/categories/${cat.slug}`}
                    className="flex items-center justify-between px-3 py-2.5 transition-all duration-200"
                    style={{ 
                      color: colors.text,
                      borderRadius: getBorderRadius(template, 'sm'),
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = getColorWithOpacity(colors.accent, 0.1);
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color || colors.accent }}
                      />
                      <span className="text-sm font-medium">
                        {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: colors.textMuted }} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter CTA */}
            <div 
              className="text-center overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
                borderRadius,
                padding: spacing.lg,
              }}
            >
              <Bell className="w-10 h-10 mx-auto mb-4 text-white/80" />
              <h3 
                className="text-lg font-bold text-white mb-2"
                style={{ fontFamily: template.typography.headingFont }}
              >
                Newsletter
              </h3>
              <p className="text-sm text-white/75 mb-5">
                {locale === 'de' ? 'Neuigkeiten direkt in Ihr Postfach' : 'News delivered to your inbox'}
              </p>
              <input
                type="email"
                placeholder={locale === 'de' ? 'E-Mail eingeben' : 'Enter email'}
                className="w-full px-4 py-3 text-sm bg-white/95"
                style={{ 
                  color: colors.text,
                  borderRadius: getBorderRadius(template, 'md'),
                }}
              />
              <button
                className="w-full px-4 py-3 mt-3 text-sm font-bold transition-all"
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  color: 'white',
                  borderRadius: getBorderRadius(template, 'md'),
                }}
              >
                {locale === 'de' ? 'Abonnieren' : 'Subscribe'}
              </button>
            </div>
          </aside>
        </div>

        {/* MORE ARTICLES - Full Width Grid */}
        {moreArticles.length > 0 && (
          <section 
            style={{ 
              marginTop: spacing['2xl'], 
              paddingTop: spacing.xl, 
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            <div 
              className="flex items-center justify-between mb-8 pb-4"
              style={{ borderBottom: `2px solid ${colors.accent}` }}
            >
              <h2 
                className="text-lg font-bold"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  color: colors.text,
                }}
              >
                {locale === 'de' ? 'Weitere Artikel' : 'More Stories'}
              </h2>
            </div>
            
            <div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              style={{ gap: spacing.lg }}
            >
              {moreArticles.slice(0, 12).map((article) => (
                <Link
                  key={article.slug}
                  href={`/${locale}/article/${article.slug}`}
                  className="group block transition-all duration-300"
                  style={{ 
                    backgroundColor: colors.surface,
                    borderRadius: getBorderRadius(template, 'md'),
                    overflow: 'hidden',
                    border: `1px solid ${colors.border}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = getShadow(template, 'strong');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div style={{ padding: spacing.md }}>
                    {article.category && (
                      <span 
                        className="text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: colors.accent }}
                      >
                        {getCategoryName(article.category)}
                      </span>
                    )}
                    <h3 
                      className="text-sm font-bold line-clamp-2 leading-snug mt-1"
                      style={{ color: colors.text }}
                    >
                      {article.title}
                    </h3>
                    <p 
                      className="text-[11px] mt-2"
                      style={{ color: colors.textMuted }}
                    >
                      {article.date}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
