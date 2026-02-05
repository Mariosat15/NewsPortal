'use client';

import { HomeLayoutProps } from '@/lib/templates/types';
import { OverlayCard } from '../cards/OverlayCard';
import { CompactCard } from '../cards/CompactCard';
import { getCardComponent } from '../cards';

export function MagazineLayout({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;
  const CardComponent = getCardComponent(template.layout.articleCard);
  
  const heroArticle = articles[0];
  const sideArticles = articles.slice(1, 4);
  const categoryArticles = articles.slice(4);

  // Group remaining by category
  const articlesByCategory: Record<string, typeof articles> = {};
  categoryArticles.forEach(article => {
    const cat = article.category || 'other';
    if (!articlesByCategory[cat]) articlesByCategory[cat] = [];
    articlesByCategory[cat].push(article);
  });

  return (
    <div className="py-8">
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Hero Section */}
        {heroArticle && (
          <section 
            className="grid grid-cols-1 lg:grid-cols-3 mb-12"
            style={{ gap: template.spacing.cardGap }}
          >
            {/* Main Hero */}
            <div className="lg:col-span-2">
              <OverlayCard
                article={heroArticle}
                template={template}
                locale={locale}
                size="large"
              />
            </div>

            {/* Side Articles */}
            <div 
              className="flex flex-col"
              style={{ gap: template.spacing.cardGap }}
            >
              {sideArticles.map((article) => (
                <OverlayCard
                  key={article.slug}
                  article={article}
                  template={template}
                  locale={locale}
                  size="small"
                />
              ))}
            </div>
          </section>
        )}

        {/* Category Sections */}
        {Object.entries(articlesByCategory).slice(0, 3).map(([categorySlug, catArticles]) => {
          const category = categories.find(c => c.slug === categorySlug);
          const displayName = category?.displayName[locale as 'de' | 'en'] || categorySlug;
          
          return (
            <section key={categorySlug} className="mb-12">
              {/* Section Header */}
              <div 
                className="flex items-center gap-4 mb-6 pb-3 border-b"
                style={{ borderColor: colors.border }}
              >
                <h2 
                  className="text-xl font-bold uppercase tracking-wide"
                  style={{ 
                    fontFamily: template.typography.headingFont,
                    color: colors.text,
                  }}
                >
                  {displayName}
                </h2>
                <div className="flex-1" />
                <a 
                  href={`/${locale}/categories/${categorySlug}`}
                  className="text-sm font-medium"
                  style={{ color: colors.accent }}
                >
                  {locale === 'de' ? 'Alle anzeigen' : 'View all'}
                </a>
              </div>

              {/* Category Grid */}
              <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                style={{ gap: template.spacing.cardGap }}
              >
                {catArticles.slice(0, 4).map((article) => (
                  <CardComponent
                    key={article.slug}
                    article={article}
                    template={template}
                    locale={locale}
                    showCategory={false}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Trending Sidebar Section */}
        {articles.length > 10 && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 
                className="text-xl font-bold mb-6"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  color: colors.text,
                }}
              >
                {locale === 'de' ? 'Neueste Artikel' : 'Latest Articles'}
              </h2>
              <div 
                className="grid grid-cols-1 md:grid-cols-2"
                style={{ gap: template.spacing.cardGap }}
              >
                {articles.slice(10, 16).map((article) => (
                  <CardComponent
                    key={article.slug}
                    article={article}
                    template={template}
                    locale={locale}
                  />
                ))}
              </div>
            </div>

            <aside>
              <h3 
                className="text-sm font-bold uppercase tracking-wider mb-4"
                style={{ color: colors.textMuted }}
              >
                {locale === 'de' ? 'Beliebt' : 'Popular'}
              </h3>
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: colors.surfaceAlt }}
              >
                {articles.slice(0, 5).map((article) => (
                  <CompactCard
                    key={article.slug}
                    article={article}
                    template={template}
                    locale={locale}
                    showCategory={false}
                  />
                ))}
              </div>
            </aside>
          </section>
        )}
      </div>
    </div>
  );
}
