'use client';

import Link from 'next/link';
import Image from 'next/image';
import { HomeLayoutProps } from '@/lib/templates/types';
import { OverlayCard } from '../cards/OverlayCard';
import { CompactCard } from '../cards/CompactCard';
import { getCardComponent } from '../cards';
import { Clock, TrendingUp, ChevronRight, Mail } from 'lucide-react';

export function MagazineLayout({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;
  const CardComponent = getCardComponent(template.layout.articleCard);
  
  const heroArticle = articles[0];
  const featuredArticles = articles.slice(1, 5);
  const categoryArticles = articles.slice(5);

  // Group remaining by category
  const articlesByCategory: Record<string, typeof articles> = {};
  categoryArticles.forEach(article => {
    const cat = article.category || 'other';
    if (!articlesByCategory[cat]) articlesByCategory[cat] = [];
    articlesByCategory[cat].push(article);
  });

  // Get trending (first few articles)
  const trendingArticles = articles.slice(0, 6);

  return (
    <div>
      {/* Breaking News Ticker */}
      <div 
        className="py-2 overflow-hidden"
        style={{ backgroundColor: colors.accent }}
      >
        <div 
          className="mx-auto px-4 flex items-center gap-4"
          style={{ maxWidth: template.spacing.containerMax }}
        >
          <span className="shrink-0 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white bg-black/20 rounded">
            {locale === 'de' ? 'Eilmeldung' : 'Breaking'}
          </span>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm text-white truncate font-medium">
              {heroArticle?.title || (locale === 'de' ? 'Willkommen zu den neuesten Nachrichten' : 'Welcome to the latest news')}
            </p>
          </div>
        </div>
      </div>

      <div className="py-8">
        <div 
          className="mx-auto px-4"
          style={{ maxWidth: template.spacing.containerMax }}
        >
          {/* Main Hero Section - Professional Layout */}
          {heroArticle && (
            <section className="mb-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Featured Article - Large */}
                <div className="lg:col-span-7">
                  <Link 
                    href={`/${locale}/article/${heroArticle.slug}`}
                    className="group relative block aspect-[16/10] rounded-xl overflow-hidden"
                  >
                    <Image
                      src={heroArticle.image || heroArticle.thumbnail || '/images/placeholder.jpg'}
                      alt={heroArticle.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    
                    {/* Category Badge */}
                    {heroArticle.category && (
                      <span 
                        className="absolute top-4 left-4 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white rounded"
                        style={{ backgroundColor: colors.accent }}
                      >
                        {heroArticle.category}
                      </span>
                    )}
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <h2 
                        className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight"
                        style={{ fontFamily: template.typography.headingFont }}
                      >
                        {heroArticle.title}
                      </h2>
                      <p className="text-white/80 text-sm md:text-base line-clamp-2 mb-4 max-w-2xl">
                        {heroArticle.excerpt || heroArticle.teaser}
                      </p>
                      <div className="flex items-center gap-4 text-white/60 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {heroArticle.date}
                        </span>
                        {heroArticle.author && <span>{heroArticle.author}</span>}
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Side Featured Articles */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                  {featuredArticles.map((article, idx) => (
                    <Link 
                      key={article.slug}
                      href={`/${locale}/article/${article.slug}`}
                      className={`group relative block rounded-lg overflow-hidden ${idx === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'}`}
                    >
                      <Image
                        src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      
                      {article.category && (
                        <span 
                          className="absolute top-3 left-3 px-2 py-1 text-[10px] font-bold uppercase text-white rounded"
                          style={{ backgroundColor: colors.accent }}
                        >
                          {article.category}
                        </span>
                      )}
                      
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-sm md:text-base font-bold text-white line-clamp-2 leading-tight">
                          {article.title}
                        </h3>
                        <p className="text-white/60 text-xs mt-1">{article.date}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Main Content + Sidebar Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {/* Category Sections */}
              {Object.entries(articlesByCategory).slice(0, 3).map(([categorySlug, catArticles]) => {
                const category = categories.find(c => c.slug === categorySlug);
                const displayName = category?.displayName?.[locale as 'de' | 'en'] || category?.displayName?.de || categorySlug;
                
                return (
                  <section key={categorySlug} className="mb-10">
                    {/* Section Header */}
                    <div 
                      className="flex items-center justify-between mb-6 pb-3 border-b-2"
                      style={{ borderColor: colors.accent }}
                    >
                      <h2 
                        className="text-xl font-bold uppercase tracking-wide flex items-center gap-2"
                        style={{ 
                          fontFamily: template.typography.headingFont,
                          color: colors.text,
                        }}
                      >
                        <span 
                          className="w-1 h-6 rounded"
                          style={{ backgroundColor: colors.accent }}
                        />
                        {displayName}
                      </h2>
                      <Link 
                        href={`/${locale}/categories/${categorySlug}`}
                        className="text-sm font-medium flex items-center gap-1 hover:underline"
                        style={{ color: colors.accent }}
                      >
                        {locale === 'de' ? 'Alle anzeigen' : 'View all'}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Category Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {catArticles.slice(0, 4).map((article, idx) => (
                        <Link 
                          key={article.slug}
                          href={`/${locale}/article/${article.slug}`}
                          className={`group flex gap-4 ${idx === 0 ? 'md:col-span-2 md:flex-row' : 'flex-row'}`}
                        >
                          <div className={`relative shrink-0 rounded-lg overflow-hidden ${idx === 0 ? 'w-full md:w-1/2 aspect-video' : 'w-24 h-20'}`}>
                            <Image
                              src={article.image || article.thumbnail || '/images/placeholder.jpg'}
                              alt={article.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="flex-1 py-1">
                            <h3 
                              className={`font-bold leading-tight line-clamp-2 group-hover:underline ${idx === 0 ? 'text-lg md:text-xl' : 'text-sm'}`}
                              style={{ color: colors.text, fontFamily: template.typography.headingFont }}
                            >
                              {article.title}
                            </h3>
                            {idx === 0 && (
                              <p 
                                className="text-sm mt-2 line-clamp-2 hidden md:block"
                                style={{ color: colors.textMuted }}
                              >
                                {article.excerpt || article.teaser}
                              </p>
                            )}
                            <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
                              {article.date}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-8">
              {/* Trending Section */}
              <div 
                className="rounded-xl p-5"
                style={{ backgroundColor: colors.surfaceAlt }}
              >
                <h3 
                  className="text-lg font-bold mb-4 flex items-center gap-2"
                  style={{ color: colors.text, fontFamily: template.typography.headingFont }}
                >
                  <TrendingUp className="w-5 h-5" style={{ color: colors.accent }} />
                  {locale === 'de' ? 'Trending' : 'Trending'}
                </h3>
                <div className="space-y-4">
                  {trendingArticles.slice(0, 5).map((article, idx) => (
                    <Link 
                      key={article.slug}
                      href={`/${locale}/article/${article.slug}`}
                      className="flex items-start gap-4 group"
                    >
                      <span 
                        className="text-2xl font-bold opacity-30"
                        style={{ color: colors.accent }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1">
                        <h4 
                          className="text-sm font-semibold line-clamp-2 group-hover:underline"
                          style={{ color: colors.text }}
                        >
                          {article.title}
                        </h4>
                        <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                          {article.date}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newsletter CTA */}
              <div 
                className="rounded-xl p-6 text-center"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)`,
                }}
              >
                <Mail className="w-10 h-10 mx-auto mb-3 text-white/80" />
                <h3 className="text-lg font-bold text-white mb-2">
                  {locale === 'de' ? 'Newsletter' : 'Newsletter'}
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  {locale === 'de' ? 'Verpassen Sie keine Neuigkeiten' : "Don't miss any news"}
                </p>
                <input
                  type="email"
                  placeholder={locale === 'de' ? 'E-Mail eingeben...' : 'Enter email...'}
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-white/95 text-gray-800 placeholder-gray-500 mb-3"
                />
                <button 
                  className="w-full py-2.5 rounded-lg text-sm font-semibold bg-black/20 text-white hover:bg-black/30 transition-colors"
                >
                  {locale === 'de' ? 'Abonnieren' : 'Subscribe'}
                </button>
              </div>

              {/* Categories Widget */}
              <div 
                className="rounded-xl p-5"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
              >
                <h3 
                  className="text-lg font-bold mb-4"
                  style={{ color: colors.text, fontFamily: template.typography.headingFont }}
                >
                  {locale === 'de' ? 'Kategorien' : 'Categories'}
                </h3>
                <div className="space-y-2">
                  {categories.filter(c => c.enabled).slice(0, 8).map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/${locale}/categories/${cat.slug}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-black/5 transition-colors"
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
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
