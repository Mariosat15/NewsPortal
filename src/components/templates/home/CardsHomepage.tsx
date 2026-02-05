'use client';

import { HomeLayoutProps } from '@/lib/templates/types';
import { BoldCard } from '../cards/BoldCard';
import { HorizontalCard } from '../cards/HorizontalCard';

export function CardsHomepage({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;
  
  const featuredArticles = articles.slice(0, 4);
  const latestArticles = articles.slice(4, 12);
  const moreArticles = articles.slice(12);

  return (
    <div className="py-8">
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Featured Cards */}
        <section className="mb-12">
          <h2 
            className="text-2xl font-bold mb-6"
            style={{ 
              fontFamily: template.typography.headingFont,
              color: colors.text,
            }}
          >
            {locale === 'de' ? 'Ausgewählte Artikel' : 'Featured Stories'}
          </h2>
          
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            style={{ gap: template.spacing.cardGap }}
          >
            {featuredArticles.map((article) => (
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
              className="flex items-center justify-between mb-6 pb-3 border-b"
              style={{ borderColor: colors.border }}
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

            <div className="space-y-4">
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
          <aside>
            {/* Categories */}
            <div 
              className="p-5 rounded-xl mb-6"
              style={{ 
                backgroundColor: colors.surfaceAlt,
                borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.75rem',
              }}
            >
              <h3 
                className="text-sm font-bold uppercase tracking-wider mb-4"
                style={{ color: colors.textMuted }}
              >
                {locale === 'de' ? 'Kategorien' : 'Categories'}
              </h3>
              
              <div className="space-y-2">
                {categories.filter(c => c.enabled).map((cat) => (
                  <a
                    key={cat.slug}
                    href={`/${locale}/categories/${cat.slug}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                    style={{ color: colors.text }}
                  >
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color || colors.accent }}
                    />
                    <span className="text-sm font-medium flex-1">
                      {cat.displayName[locale as 'de' | 'en'] || cat.displayName.de}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Newsletter CTA */}
            <div 
              className="p-5 rounded-xl text-center"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
                borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.75rem',
              }}
            >
              <h3 className="text-lg font-bold text-white mb-2">
                {locale === 'de' ? 'Newsletter' : 'Newsletter'}
              </h3>
              <p className="text-sm text-white/80 mb-4">
                {locale === 'de' ? 'Bleiben Sie auf dem Laufenden' : 'Stay up to date'}
              </p>
              <input
                type="email"
                placeholder={locale === 'de' ? 'E-Mail eingeben' : 'Enter email'}
                className="w-full px-4 py-2 rounded-lg text-sm mb-3"
                style={{ 
                  backgroundColor: 'white',
                  color: colors.text,
                }}
              />
              <button
                className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{ 
                  backgroundColor: colors.text,
                  color: 'white',
                }}
              >
                {locale === 'de' ? 'Abonnieren' : 'Subscribe'}
              </button>
            </div>
          </aside>
        </div>

        {/* More Articles */}
        {moreArticles.length > 0 && (
          <section className="mt-12">
            <h2 
              className="text-xl font-bold mb-6"
              style={{ 
                fontFamily: template.typography.headingFont,
                color: colors.text,
              }}
            >
              {locale === 'de' ? 'Weitere Artikel' : 'More Stories'}
            </h2>
            
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
