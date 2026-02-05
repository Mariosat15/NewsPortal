'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight, Bookmark, Quote, Calendar, TrendingUp } from 'lucide-react';
import { HomeLayoutProps } from '@/lib/templates/types';
import { 
  getSpacingScale, 
  getBorderRadius, 
  getShadow,
  getColorWithOpacity,
} from '@/lib/templates/utils';

export function EditorialHomepage({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;
  const spacing = getSpacingScale(template);
  const borderRadius = getBorderRadius(template, 'sm'); // Editorial uses subtle radius
  
  // Expanded article distribution
  const leadArticle = articles[0];
  const topStories = articles.slice(1, 5); // 4 top stories
  const featuredOpinion = articles[4];
  const opinionArticles = articles.slice(5, 9); // 4 opinion pieces
  const latestArticles = articles.slice(9, 21); // 12 latest articles
  const moreArticles = articles.slice(21, 33); // 12 more articles

  // Get category display name
  const getCategoryName = (slug: string) => {
    const category = categories.find(c => c.slug === slug);
    return category?.displayName?.[locale as 'de' | 'en'] || category?.displayName?.de || slug;
  };

  // Format date in editorial style
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div style={{ backgroundColor: colors.background }}>
      {/* Editorial Header Bar - Classic Newspaper Style */}
      <div 
        style={{ 
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
          padding: `${spacing.sm} 0`,
        }}
      >
        <div 
          className="mx-auto px-4 flex items-center justify-between"
          style={{ maxWidth: template.spacing.containerMax }}
        >
          <div className="flex items-center gap-2" style={{ color: colors.textMuted }}>
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {new Date().toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <div className="flex items-center gap-6">
            {categories.filter(c => c.enabled).slice(0, 8).map((cat) => (
              <Link
                key={cat.slug}
                href={`/${locale}/categories/${cat.slug}`}
                className="text-xs font-medium uppercase tracking-wider hover:underline hidden lg:block"
                style={{ color: colors.textMuted }}
              >
                {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
              </Link>
            ))}
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
        {/* LEAD STORY SECTION - Classic Newspaper Layout */}
        {leadArticle && (
          <section style={{ marginBottom: spacing['2xl'] }}>
            <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: spacing.xl }}>
              {/* Main Lead Story */}
              <div className="lg:col-span-8">
                <Link 
                  href={`/${locale}/article/${leadArticle.slug}`}
                  className="group relative block aspect-[16/10] overflow-hidden mb-6"
                  style={{ borderRadius }}
                >
                  <Image
                    src={leadArticle.image || leadArticle.thumbnail || '/images/placeholder.jpg'}
                    alt={leadArticle.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    priority
                  />
                </Link>

                {leadArticle.category && (
                  <span 
                    className="text-xs font-bold uppercase tracking-[0.15em] mb-4 block"
                    style={{ color: colors.accent }}
                  >
                    {getCategoryName(leadArticle.category)}
                  </span>
                )}
                
                <Link href={`/${locale}/article/${leadArticle.slug}`}>
                  <h1 
                    className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 leading-[1.1] hover:underline decoration-2 underline-offset-4"
                    style={{ 
                      fontFamily: template.typography.headingFont,
                      fontWeight: template.typography.headingWeight,
                      color: colors.text,
                    }}
                  >
                    {leadArticle.title}
                  </h1>
                </Link>

                {(leadArticle.excerpt || leadArticle.teaser) && (
                  <p 
                    className="text-lg md:text-xl mb-6 leading-relaxed"
                    style={{ 
                      fontFamily: template.typography.bodyFont,
                      color: colors.textMuted,
                    }}
                  >
                    {leadArticle.excerpt || leadArticle.teaser}
                  </p>
                )}

                {/* Byline */}
                <div 
                  className="flex flex-wrap items-center gap-4 text-sm pt-4"
                  style={{ 
                    color: colors.textMuted, 
                    borderTop: `1px solid ${colors.border}`,
                  }}
                >
                  {leadArticle.author && (
                    <span className="font-semibold" style={{ color: colors.text }}>
                      {locale === 'de' ? 'Von' : 'By'} {leadArticle.author}
                    </span>
                  )}
                  <span>{formatDate(leadArticle.date || leadArticle.publishDate)}</span>
                  {leadArticle.readingTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {leadArticle.readingTime} min
                    </span>
                  )}
                </div>
              </div>

              {/* Top Stories Sidebar - With Column Rule */}
              <div 
                className="lg:col-span-4"
                style={{ 
                  borderLeft: `1px solid ${colors.border}`,
                  paddingLeft: spacing.lg,
                }}
              >
                <h3 
                  className="text-sm font-bold uppercase tracking-[0.1em] mb-6 pb-3"
                  style={{ 
                    color: colors.text,
                    borderBottom: `3px solid ${colors.accent}`,
                  }}
                >
                  {locale === 'de' ? 'Weitere Top-Nachrichten' : 'More Top Stories'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                  {topStories.map((article, idx) => (
                    <article 
                      key={article.slug}
                      className="group"
                      style={{ 
                        paddingBottom: spacing.lg,
                        borderBottom: idx < topStories.length - 1 ? `1px solid ${colors.border}` : 'none',
                      }}
                    >
                      <span 
                        className="text-4xl font-black leading-none -mb-1 block"
                        style={{ 
                          fontFamily: template.typography.headingFont, 
                          color: getColorWithOpacity(colors.accent, 0.15),
                        }}
                      >
                        {String(idx + 2).padStart(2, '0')}
                      </span>
                      {article.category && (
                        <span 
                          className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2 mt-2 block"
                          style={{ color: colors.accent }}
                        >
                          {getCategoryName(article.category)}
                        </span>
                      )}
                      <Link href={`/${locale}/article/${article.slug}`}>
                        <h3 
                          className="text-base md:text-lg font-bold leading-snug group-hover:underline"
                          style={{ 
                            fontFamily: template.typography.headingFont,
                            color: colors.text,
                          }}
                        >
                          {article.title}
                        </h3>
                      </Link>
                      <p 
                        className="text-xs mt-2"
                        style={{ color: colors.textMuted }}
                      >
                        {formatDate(article.date || article.publishDate)}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Featured Quote / Opinion Box */}
        {featuredOpinion && (
          <div 
            className="relative overflow-hidden"
            style={{ 
              backgroundColor: colors.surfaceAlt,
              borderLeft: `4px solid ${colors.accent}`,
              padding: spacing.xl,
              marginBottom: spacing['2xl'],
            }}
          >
            <Quote 
              className="absolute top-4 right-4 w-16 h-16"
              style={{ color: getColorWithOpacity(colors.accent, 0.1) }}
            />
            <span 
              className="text-xs font-bold uppercase tracking-[0.15em] mb-4 block"
              style={{ color: colors.accent }}
            >
              {locale === 'de' ? 'Hervorgehoben' : 'Featured'}
            </span>
            <Link href={`/${locale}/article/${featuredOpinion.slug}`}>
              <blockquote 
                className="text-2xl md:text-3xl font-bold leading-snug hover:underline decoration-2"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  color: colors.text,
                }}
              >
                &ldquo;{featuredOpinion.title}&rdquo;
              </blockquote>
            </Link>
            {featuredOpinion.author && (
              <p 
                className="mt-4 font-medium"
                style={{ color: colors.textMuted }}
              >
                — {featuredOpinion.author}
              </p>
            )}
          </div>
        )}

        {/* THREE COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: spacing.xl }}>
          {/* LEFT COLUMN - Latest News */}
          <div className="lg:col-span-5">
            <div 
              className="flex items-center justify-between mb-6 pb-3"
              style={{ borderBottom: `3px solid ${colors.accent}` }}
            >
              <h2 
                className="text-base font-bold uppercase tracking-[0.1em]"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  color: colors.text,
                }}
              >
                {locale === 'de' ? 'Neueste Nachrichten' : 'Latest News'}
              </h2>
              <Link 
                href={`/${locale}`}
                className="flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: colors.accent }}
              >
                {locale === 'de' ? 'Alle' : 'All'}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
              {latestArticles.slice(0, 6).map((article, idx) => (
                <article 
                  key={article.slug} 
                  className="group"
                  style={{
                    paddingBottom: spacing.lg,
                    borderBottom: idx < 5 ? `1px solid ${colors.border}` : 'none',
                  }}
                >
                  <Link 
                    href={`/${locale}/article/${article.slug}`}
                    className="flex gap-4"
                  >
                    <div 
                      className="relative shrink-0 w-24 h-20 overflow-hidden"
                      style={{ borderRadius: getBorderRadius(template, 'sm') }}
                    >
                      <Image
                        src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {article.category && (
                        <span 
                          className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1 block"
                          style={{ color: colors.accent }}
                        >
                          {getCategoryName(article.category)}
                        </span>
                      )}
                      <h3 
                        className="text-sm font-bold leading-snug line-clamp-2 group-hover:underline"
                        style={{ 
                          fontFamily: template.typography.headingFont,
                          color: colors.text,
                        }}
                      >
                        {article.title}
                      </h3>
                      <p 
                        className="text-[11px] mt-1.5"
                        style={{ color: colors.textMuted }}
                      >
                        {formatDate(article.date || article.publishDate)}
                      </p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>

          {/* CENTER COLUMN - Featured Grid */}
          <div 
            className="lg:col-span-4"
            style={{
              borderLeft: `1px solid ${colors.border}`,
              borderRight: `1px solid ${colors.border}`,
              paddingLeft: spacing.lg,
              paddingRight: spacing.lg,
            }}
          >
            <div 
              className="flex items-center justify-between mb-6 pb-3"
              style={{ borderBottom: `3px solid ${colors.accent}` }}
            >
              <h2 
                className="text-base font-bold uppercase tracking-[0.1em]"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  color: colors.text,
                }}
              >
                {locale === 'de' ? 'Im Fokus' : 'In Focus'}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
              {latestArticles.slice(6, 12).map((article, idx) => (
                <article key={article.slug} className="group">
                  <Link href={`/${locale}/article/${article.slug}`}>
                    <div 
                      className="relative aspect-[16/10] overflow-hidden mb-3"
                      style={{ borderRadius }}
                    >
                      <Image
                        src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {article.category && (
                      <span 
                        className="text-[10px] font-bold uppercase tracking-[0.1em] mb-2 block"
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
                      className="text-xs mt-2 line-clamp-2"
                      style={{ color: colors.textMuted }}
                    >
                      {article.excerpt || article.teaser}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN - Opinion & Categories */}
          <aside className="lg:col-span-3">
            {/* Opinion Section */}
            <div style={{ marginBottom: spacing.xl }}>
              <div 
                className="flex items-center gap-2 mb-6 pb-3"
                style={{ borderBottom: `3px solid ${colors.accent}` }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: colors.accent }} />
                <h3 
                  className="text-sm font-bold uppercase tracking-[0.1em]"
                  style={{ 
                    fontFamily: template.typography.headingFont,
                    color: colors.text,
                  }}
                >
                  {locale === 'de' ? 'Meinung' : 'Opinion'}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                {opinionArticles.map((article, idx) => (
                  <Link 
                    key={article.slug}
                    href={`/${locale}/article/${article.slug}`}
                    className="group block"
                    style={{
                      paddingBottom: spacing.md,
                      borderBottom: idx < opinionArticles.length - 1 ? `1px solid ${colors.border}` : 'none',
                    }}
                  >
                    <h4 
                      className="text-sm font-bold leading-snug line-clamp-2 group-hover:underline"
                      style={{ 
                        fontFamily: template.typography.headingFont,
                        color: colors.text,
                      }}
                    >
                      {article.title}
                    </h4>
                    {article.author && (
                      <p 
                        className="text-xs mt-1 italic"
                        style={{ color: colors.textMuted }}
                      >
                        {article.author}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories Box */}
            <div 
              style={{ 
                backgroundColor: colors.surfaceAlt,
                borderRadius: getBorderRadius(template, 'md'),
                padding: spacing.lg,
              }}
            >
              <h3 
                className="text-sm font-bold uppercase tracking-[0.1em] mb-4 flex items-center gap-2"
                style={{ color: colors.text }}
              >
                <Bookmark className="w-4 h-4" style={{ color: colors.accent }} />
                {locale === 'de' ? 'Kategorien' : 'Categories'}
              </h3>
              <div className="flex flex-wrap" style={{ gap: spacing.xs }}>
                {categories.filter(c => c.enabled).slice(0, 20).map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/${locale}/categories/${cat.slug}`}
                    className="px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{ 
                      backgroundColor: colors.surface,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      borderRadius: getBorderRadius(template, 'sm'),
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.accent;
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = colors.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.surface;
                      e.currentTarget.style.color = colors.text;
                      e.currentTarget.style.borderColor = colors.border;
                    }}
                  >
                    {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* MORE ARTICLES - Full Width Grid */}
        {moreArticles.length > 0 && (
          <section style={{ marginTop: spacing['2xl'], paddingTop: spacing.xl, borderTop: `1px solid ${colors.border}` }}>
            <div 
              className="flex items-center justify-between mb-8 pb-3"
              style={{ borderBottom: `3px solid ${colors.accent}` }}
            >
              <h2 
                className="text-lg font-bold uppercase tracking-[0.1em]"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  color: colors.text,
                }}
              >
                {locale === 'de' ? 'Weitere Artikel' : 'More Articles'}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4" style={{ gap: spacing.lg }}>
              {moreArticles.slice(0, 8).map((article) => (
                <article key={article.slug} className="group">
                  <Link href={`/${locale}/article/${article.slug}`}>
                    <div 
                      className="relative aspect-[16/10] overflow-hidden mb-3"
                      style={{ borderRadius }}
                    >
                      <Image
                        src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {article.category && (
                      <span 
                        className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1 block"
                        style={{ color: colors.accent }}
                      >
                        {getCategoryName(article.category)}
                      </span>
                    )}
                    <h3 
                      className="text-sm font-bold leading-snug line-clamp-2 group-hover:underline"
                      style={{ 
                        fontFamily: template.typography.headingFont,
                        color: colors.text,
                      }}
                    >
                      {article.title}
                    </h3>
                    <p 
                      className="text-[11px] mt-1.5"
                      style={{ color: colors.textMuted }}
                    >
                      {formatDate(article.date || article.publishDate)}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
