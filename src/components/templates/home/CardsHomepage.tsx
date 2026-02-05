'use client';

import Link from 'next/link';
import Image from 'next/image';
import { HomeLayoutProps } from '@/lib/templates/types';
import { BoldCard } from '../cards/BoldCard';
import { HorizontalCard } from '../cards/HorizontalCard';
import { Sparkles, ArrowRight, Tag, Bell, ChevronRight } from 'lucide-react';

export function CardsHomepage({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;
  
  const heroArticle = articles[0];
  const featuredArticles = articles.slice(1, 5);
  const latestArticles = articles.slice(5, 13);
  const moreArticles = articles.slice(13);

  return (
    <div className="py-8">
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Hero Section with Featured */}
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Hero */}
            {heroArticle && (
              <div className="lg:col-span-2">
                <Link
                  href={`/${locale}/article/${heroArticle.slug}`}
                  className="group relative block aspect-[16/9] overflow-hidden"
                  style={{ 
                    borderRadius: template.features.roundedCorners === 'none' ? '0' : '1rem',
                  }}
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
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                    }}
                  />
                  
                  {heroArticle.category && (
                    <span 
                      className="absolute top-4 left-4 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
                      style={{ 
                        backgroundColor: colors.accent,
                        borderRadius: template.features.roundedCorners === 'none' ? '0' : '9999px',
                      }}
                    >
                      {heroArticle.category}
                    </span>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <h2 
                      className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 line-clamp-3"
                      style={{ fontFamily: template.typography.headingFont }}
                    >
                      {heroArticle.title}
                    </h2>
                    <p className="text-white/70 text-sm md:text-base line-clamp-2 mb-4 max-w-2xl hidden md:block">
                      {heroArticle.excerpt || heroArticle.teaser}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      {heroArticle.author && <span>{heroArticle.author}</span>}
                      {heroArticle.date && <span>{heroArticle.date}</span>}
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Side Featured Stack */}
            <div className="space-y-4">
              {featuredArticles.slice(0, 2).map((article) => (
                <Link
                  key={article.slug}
                  href={`/${locale}/article/${article.slug}`}
                  className="group relative block aspect-[16/9] overflow-hidden"
                  style={{ 
                    borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.75rem',
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
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 70%)',
                    }}
                  />
                  
                  {article.category && (
                    <span 
                      className="absolute top-3 left-3 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: colors.accent }}
                    >
                      {article.category}
                    </span>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 
                      className="text-base font-bold text-white line-clamp-2"
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

        {/* Featured Cards Row */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" style={{ color: colors.accent }} />
              <h2 
                className="text-xl font-bold"
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            style={{ gap: template.spacing.cardGap }}
          >
            {featuredArticles.slice(0, 4).map((article) => (
              <BoldCard
                key={article.slug}
                article={article}
                template={template}
                locale={locale}
              />
            ))}
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Latest Articles */}
          <div className="lg:col-span-2">
            <div 
              className="flex items-center justify-between mb-6 pb-4 border-b-2"
              style={{ borderColor: colors.accent }}
            >
              <h2 
                className="text-xl font-bold"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  color: colors.text,
                }}
              >
                {locale === 'de' ? 'Neueste Nachrichten' : 'Latest News'}
              </h2>
            </div>

            <div className="space-y-0">
              {latestArticles.map((article) => (
                <HorizontalCard
                  key={article.slug}
                  article={article}
                  template={template}
                  locale={locale}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Categories */}
            <div 
              className="p-6"
              style={{ 
                backgroundColor: colors.surfaceAlt,
                borderRadius: template.features.roundedCorners === 'none' ? '0' : '1rem',
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <Tag className="w-4 h-4" style={{ color: colors.accent }} />
                <h3 
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: colors.text }}
                >
                  {locale === 'de' ? 'Kategorien' : 'Categories'}
                </h3>
              </div>
              
              <div className="space-y-1">
                {categories.filter(c => c.enabled).slice(0, 8).map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/${locale}/categories/${cat.slug}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-all hover:translate-x-1"
                    style={{ color: colors.text }}
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color || colors.accent }}
                      />
                      <span className="text-sm font-medium">
                        {cat.displayName[locale as 'de' | 'en'] || cat.displayName.de}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter CTA */}
            <div 
              className="p-6 text-center"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
                borderRadius: template.features.roundedCorners === 'none' ? '0' : '1rem',
              }}
            >
              <Bell className="w-10 h-10 mx-auto mb-4 text-white/80" />
              <h3 className="text-lg font-bold text-white mb-2">
                {locale === 'de' ? 'Newsletter' : 'Newsletter'}
              </h3>
              <p className="text-sm text-white/80 mb-5">
                {locale === 'de' ? 'Erhalten Sie die neuesten Nachrichten direkt in Ihr Postfach' : 'Get the latest news delivered to your inbox'}
              </p>
              <input
                type="email"
                placeholder={locale === 'de' ? 'E-Mail eingeben' : 'Enter email'}
                className="w-full px-4 py-3 rounded-lg text-sm mb-3 bg-white/95"
                style={{ color: colors.text }}
              />
              <button
                className="w-full px-4 py-3 rounded-lg text-sm font-bold transition-all hover:opacity-90"
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  color: 'white',
                }}
              >
                {locale === 'de' ? 'Jetzt abonnieren' : 'Subscribe Now'}
              </button>
            </div>

            {/* Ad placeholder */}
            <div 
              className="aspect-square flex items-center justify-center"
              style={{ 
                backgroundColor: colors.surfaceAlt,
                borderRadius: template.features.roundedCorners === 'none' ? '0' : '1rem',
              }}
            >
              <span 
                className="text-xs uppercase tracking-wider"
                style={{ color: colors.textMuted }}
              >
                {locale === 'de' ? 'Werbung' : 'Advertisement'}
              </span>
            </div>
          </aside>
        </div>

        {/* More Articles */}
        {moreArticles.length > 0 && (
          <section className="mt-12 pt-12 border-t" style={{ borderColor: colors.border }}>
            <div className="flex items-center justify-between mb-8">
              <h2 
                className="text-xl font-bold"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  color: colors.text,
                }}
              >
                {locale === 'de' ? 'Weitere Artikel' : 'More Stories'}
              </h2>
            </div>
            
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              style={{ gap: template.spacing.cardGap }}
            >
              {moreArticles.slice(0, 8).map((article) => (
                <BoldCard
                  key={article.slug}
                  article={article}
                  template={template}
                  locale={locale}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
