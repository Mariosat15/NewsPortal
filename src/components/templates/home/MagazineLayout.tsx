'use client';

import Link from 'next/link';
import Image from 'next/image';
import { HomeLayoutProps } from '@/lib/templates/types';
import { 
  getSpacingScale, 
  getTypographySizes, 
  getBorderRadius, 
  getShadow,
  getColorWithOpacity,
} from '@/lib/templates/utils';
import { Clock, TrendingUp, ChevronRight, Mail, Flame, Eye } from 'lucide-react';

export function MagazineLayout({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;
  const spacing = getSpacingScale(template);
  const typography = getTypographySizes(template.typography.scale);
  const borderRadius = getBorderRadius(template, 'lg');
  const shadow = getShadow(template, 'medium');
  
  // Article distribution for maximum content density
  const heroArticle = articles[0];
  const featuredArticles = articles.slice(1, 6); // Increased to 5 side articles
  const trendingArticles = articles.slice(0, 10); // More trending
  const latestArticles = articles.slice(6, 18); // 12 latest articles
  
  // Group remaining by category
  const categoryArticles = articles.slice(18);
  const articlesByCategory: Record<string, typeof articles> = {};
  categoryArticles.forEach(article => {
    const cat = article.category || 'other';
    if (!articlesByCategory[cat]) articlesByCategory[cat] = [];
    articlesByCategory[cat].push(article);
  });

  // Get category display name
  const getCategoryName = (slug: string) => {
    const category = categories.find(c => c.slug === slug);
    return category?.displayName?.[locale as 'de' | 'en'] || category?.displayName?.de || slug;
  };

  return (
    <div style={{ backgroundColor: colors.background }}>
      {/* Breaking News Ticker - Professional Design */}
      <div 
        className="overflow-hidden"
        style={{ 
          backgroundColor: colors.accent,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        }}
      >
        <div 
          className="mx-auto px-4 flex items-center gap-4"
          style={{ maxWidth: template.spacing.containerMax }}
        >
          <span 
            className="shrink-0 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white rounded flex items-center gap-1.5"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
          >
            <Flame className="w-3.5 h-3.5" />
            {locale === 'de' ? 'Eilmeldung' : 'Breaking'}
          </span>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm text-white truncate font-medium">
              {heroArticle?.title || (locale === 'de' ? 'Willkommen zu den neuesten Nachrichten' : 'Welcome to the latest news')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div 
        className="mx-auto px-4"
        style={{ 
          maxWidth: template.spacing.containerMax,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xl,
        }}
      >
        {/* HERO SECTION - Large Featured Layout */}
        {heroArticle && (
          <section style={{ marginBottom: spacing['2xl'] }}>
            <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: spacing.lg }}>
              {/* Main Hero Article - Takes 7 columns */}
              <div className="lg:col-span-7">
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
                      background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)',
                    }}
                  />
                  
                  {/* Category Badge */}
                  {heroArticle.category && (
                    <span 
                      className="absolute top-4 left-4 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white"
                      style={{ 
                        backgroundColor: colors.accent,
                        borderRadius: getBorderRadius(template, 'sm'),
                      }}
                    >
                      {getCategoryName(heroArticle.category)}
                    </span>
                  )}
                  
                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <h2 
                      className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.15] group-hover:text-white/90 transition-colors"
                      style={{ fontFamily: template.typography.headingFont }}
                    >
                      {heroArticle.title}
                    </h2>
                    <p className="text-white/75 text-sm md:text-base line-clamp-2 mb-4 max-w-2xl">
                      {heroArticle.excerpt || heroArticle.teaser}
                    </p>
                    <div className="flex items-center gap-4 text-white/60 text-sm">
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
                </Link>
              </div>

              {/* Side Featured Articles - 5 column grid */}
              <div className="lg:col-span-5">
                <div className="grid grid-cols-2" style={{ gap: spacing.md }}>
                  {featuredArticles.slice(0, 5).map((article, idx) => (
                    <Link 
                      key={article.slug}
                      href={`/${locale}/article/${article.slug}`}
                      className={`group relative block overflow-hidden ${idx === 0 ? 'col-span-2 aspect-[2.2/1]' : 'aspect-[1.1/1]'}`}
                      style={{ borderRadius: getBorderRadius(template, 'md') }}
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
                          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                        }}
                      />
                      
                      {article.category && (
                        <span 
                          className="absolute top-2.5 left-2.5 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white"
                          style={{ 
                            backgroundColor: colors.accent,
                            borderRadius: getBorderRadius(template, 'sm'),
                          }}
                        >
                          {getCategoryName(article.category)}
                        </span>
                      )}
                      
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 
                          className={`font-bold text-white line-clamp-2 leading-tight group-hover:text-white/90 transition-colors ${idx === 0 ? 'text-base md:text-lg' : 'text-xs md:text-sm'}`}
                          style={{ fontFamily: template.typography.headingFont }}
                        >
                          {article.title}
                        </h3>
                        <p className="text-white/60 text-[10px] mt-1.5">{article.date}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* MAIN CONTENT AREA - 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: spacing.xl }}>
          
          {/* LEFT SIDEBAR - Trending */}
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div 
              className="sticky top-24"
              style={{ 
                backgroundColor: colors.surface,
                borderRadius,
                boxShadow: shadow,
                border: `1px solid ${colors.border}`,
                padding: spacing.lg,
              }}
            >
              {/* Section Header */}
              <div 
                className="flex items-center gap-2 pb-3 mb-4"
                style={{ borderBottom: `2px solid ${colors.accent}` }}
              >
                <TrendingUp className="w-5 h-5" style={{ color: colors.accent }} />
                <h3 
                  className="text-base font-bold uppercase tracking-wide"
                  style={{ color: colors.text, fontFamily: template.typography.headingFont }}
                >
                  {locale === 'de' ? 'Trending' : 'Trending'}
                </h3>
              </div>
              
              {/* Trending List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                {trendingArticles.slice(0, 8).map((article, idx) => (
                  <Link 
                    key={article.slug}
                    href={`/${locale}/article/${article.slug}`}
                    className="flex items-start gap-3 group"
                  >
                    <span 
                      className="text-2xl font-black leading-none w-7 shrink-0"
                      style={{ color: getColorWithOpacity(colors.accent, 0.3) }}
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
                      <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
                        {article.date}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* CENTER - Latest Articles */}
          <main className="lg:col-span-6 order-1 lg:order-2">
            {/* Section Header */}
            <div 
              className="flex items-center justify-between pb-3 mb-6"
              style={{ borderBottom: `2px solid ${colors.accent}` }}
            >
              <div className="flex items-center gap-2">
                <span 
                  className="w-1.5 h-6 rounded-full"
                  style={{ backgroundColor: colors.accent }}
                />
                <h2 
                  className="text-lg font-bold uppercase tracking-wide"
                  style={{ color: colors.text, fontFamily: template.typography.headingFont }}
                >
                  {locale === 'de' ? 'Neueste Artikel' : 'Latest Articles'}
                </h2>
              </div>
            </div>

            {/* Latest Articles Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
              {latestArticles.map((article, idx) => (
                <Link 
                  key={article.slug}
                  href={`/${locale}/article/${article.slug}`}
                  className="group flex gap-4"
                  style={{
                    paddingBottom: spacing.lg,
                    borderBottom: idx < latestArticles.length - 1 ? `1px solid ${colors.border}` : 'none',
                  }}
                >
                  <div 
                    className="relative shrink-0 w-32 h-24 md:w-40 md:h-28 overflow-hidden"
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
                      className="text-base md:text-lg font-bold leading-tight line-clamp-2 mt-1 group-hover:underline"
                      style={{ color: colors.text, fontFamily: template.typography.headingFont }}
                    >
                      {article.title}
                    </h3>
                    <p 
                      className="text-sm line-clamp-2 mt-2 hidden md:block"
                      style={{ color: colors.textMuted }}
                    >
                      {article.excerpt || article.teaser}
                    </p>
                    <div 
                      className="flex items-center gap-3 text-xs mt-2"
                      style={{ color: colors.textMuted }}
                    >
                      <span>{article.date}</span>
                      {article.readingTime && <span>{article.readingTime} min read</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="lg:col-span-3 order-3">
            <div className="sticky top-24 space-y-6">
              {/* Newsletter CTA */}
              <div 
                className="text-center overflow-hidden"
                style={{ 
                  borderRadius,
                  background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)`,
                  padding: spacing.lg,
                }}
              >
                <Mail className="w-10 h-10 mx-auto mb-3 text-white/80" />
                <h3 
                  className="text-lg font-bold text-white mb-2"
                  style={{ fontFamily: template.typography.headingFont }}
                >
                  {locale === 'de' ? 'Newsletter' : 'Newsletter'}
                </h3>
                <p className="text-white/75 text-sm mb-4">
                  {locale === 'de' ? 'Verpassen Sie keine Neuigkeiten' : "Don't miss any news"}
                </p>
                <input
                  type="email"
                  placeholder={locale === 'de' ? 'E-Mail eingeben...' : 'Enter email...'}
                  className="w-full px-4 py-2.5 text-sm bg-white/95 text-gray-800 placeholder-gray-500"
                  style={{ borderRadius: getBorderRadius(template, 'md') }}
                />
                <button 
                  className="w-full py-2.5 mt-3 text-sm font-semibold bg-black/20 text-white hover:bg-black/30 transition-colors"
                  style={{ borderRadius: getBorderRadius(template, 'md') }}
                >
                  {locale === 'de' ? 'Abonnieren' : 'Subscribe'}
                </button>
              </div>

              {/* Categories Widget */}
              <div 
                style={{ 
                  backgroundColor: colors.surface,
                  borderRadius,
                  boxShadow: shadow,
                  border: `1px solid ${colors.border}`,
                  padding: spacing.lg,
                }}
              >
                <h3 
                  className="text-base font-bold mb-4 pb-3"
                  style={{ 
                    color: colors.text, 
                    fontFamily: template.typography.headingFont,
                    borderBottom: `2px solid ${colors.accent}`,
                  }}
                >
                  {locale === 'de' ? 'Kategorien' : 'Categories'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                  {categories.filter(c => c.enabled).slice(0, 10).map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/${locale}/categories/${cat.slug}`}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors"
                      style={{ 
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = getColorWithOpacity(colors.accent, 0.1)}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span 
                        className="text-sm font-medium"
                        style={{ color: colors.text }}
                      >
                        {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
                      </span>
                      <ChevronRight className="w-4 h-4" style={{ color: colors.textMuted }} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* CATEGORY SECTIONS */}
        <div style={{ marginTop: spacing['2xl'] }}>
          {Object.entries(articlesByCategory).slice(0, 4).map(([categorySlug, catArticles], sectionIdx) => {
            if (catArticles.length < 2) return null;
            const displayName = getCategoryName(categorySlug);
            
            return (
              <section 
                key={categorySlug} 
                style={{ 
                  marginBottom: spacing['2xl'],
                  paddingTop: spacing.xl,
                  borderTop: sectionIdx > 0 ? `1px solid ${colors.border}` : 'none',
                }}
              >
                {/* Section Header */}
                <div 
                  className="flex items-center justify-between mb-6 pb-3"
                  style={{ borderBottom: `2px solid ${colors.accent}` }}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-1.5 h-6 rounded-full"
                      style={{ backgroundColor: colors.accent }}
                    />
                    <h2 
                      className="text-lg font-bold uppercase tracking-wide"
                      style={{ color: colors.text, fontFamily: template.typography.headingFont }}
                    >
                      {displayName}
                    </h2>
                  </div>
                  <Link 
                    href={`/${locale}/categories/${categorySlug}`}
                    className="text-sm font-medium flex items-center gap-1 hover:underline"
                    style={{ color: colors.accent }}
                  >
                    {locale === 'de' ? 'Alle anzeigen' : 'View all'}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Category Grid - Featured + Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: spacing.lg }}>
                  {/* Featured Article */}
                  <div className="lg:col-span-6">
                    <Link 
                      href={`/${locale}/article/${catArticles[0].slug}`}
                      className="group relative block aspect-[16/10] overflow-hidden"
                      style={{ borderRadius }}
                    >
                      <Image
                        src={catArticles[0].image || catArticles[0].thumbnail || '/images/placeholder.jpg'}
                        alt={catArticles[0].title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div 
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h3 
                          className="text-lg md:text-xl font-bold text-white line-clamp-2 leading-tight mb-2 group-hover:text-white/90"
                          style={{ fontFamily: template.typography.headingFont }}
                        >
                          {catArticles[0].title}
                        </h3>
                        <p className="text-white/70 text-sm line-clamp-2 hidden md:block">
                          {catArticles[0].excerpt || catArticles[0].teaser}
                        </p>
                      </div>
                    </Link>
                  </div>

                  {/* Side Articles */}
                  <div className="lg:col-span-6 grid grid-cols-2" style={{ gap: spacing.md }}>
                    {catArticles.slice(1, 5).map((article) => (
                      <Link 
                        key={article.slug}
                        href={`/${locale}/article/${article.slug}`}
                        className="group"
                      >
                        <div 
                          className="relative aspect-[16/10] overflow-hidden mb-3"
                          style={{ borderRadius: getBorderRadius(template, 'md') }}
                        >
                          <Image
                            src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <h4 
                          className="text-sm font-semibold line-clamp-2 leading-snug group-hover:underline"
                          style={{ color: colors.text }}
                        >
                          {article.title}
                        </h4>
                        <p className="text-xs mt-1.5" style={{ color: colors.textMuted }}>
                          {article.date}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
