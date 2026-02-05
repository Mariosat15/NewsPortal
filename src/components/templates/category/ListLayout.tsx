'use client';

import { CategoryLayoutProps } from '@/lib/templates/types';
import { HorizontalCard } from '../cards/HorizontalCard';
import { CompactCard } from '../cards/CompactCard';

export function ListLayout({ template, articles, locale, categoryName }: CategoryLayoutProps) {
  const colors = template.activeColors;

  return (
    <div className="py-8">
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Category Header */}
            <div 
              className="mb-6 pb-4 border-b"
              style={{ borderColor: colors.border }}
            >
              <h1 
                className="text-2xl md:text-3xl font-bold"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  fontWeight: template.typography.headingWeight,
                  color: colors.text,
                }}
              >
                {categoryName}
              </h1>
            </div>

            {/* Article List */}
            <div className="space-y-4">
              {articles.map((article) => (
                <HorizontalCard
                  key={article.slug}
                  article={article}
                  template={template}
                  locale={locale}
                />
              ))}
            </div>

            {/* Empty State */}
            {articles.length === 0 && (
              <div 
                className="text-center py-16"
                style={{ color: colors.textMuted }}
              >
                <p className="text-lg">
                  {locale === 'de' ? 'Keine Artikel in dieser Kategorie.' : 'No articles in this category.'}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside 
            className="hidden lg:block w-72 shrink-0"
          >
            <div 
              className="sticky top-24 p-4 rounded-lg"
              style={{ 
                backgroundColor: colors.surfaceAlt,
                borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.5rem',
              }}
            >
              <h3 
                className="text-sm font-bold uppercase tracking-wider mb-4"
                style={{ color: colors.textMuted }}
              >
                {locale === 'de' ? 'Beliebte Artikel' : 'Popular Articles'}
              </h3>
              
              <div>
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
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
