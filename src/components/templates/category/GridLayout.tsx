'use client';

import { CategoryLayoutProps } from '@/lib/templates/types';
import { getCardComponent } from '../cards';

export function GridLayout({ template, articles, locale, categoryName }: CategoryLayoutProps) {
  const colors = template.activeColors;
  const CardComponent = getCardComponent(template.layout.articleCard);

  return (
    <div className="py-8">
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Category Header */}
        <div className="mb-8">
          <h1 
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ 
              fontFamily: template.typography.headingFont,
              fontWeight: template.typography.headingWeight,
              color: colors.text,
            }}
          >
            {categoryName}
          </h1>
          <p 
            className="text-sm"
            style={{ color: colors.textMuted }}
          >
            {articles.length} {locale === 'de' ? 'Artikel' : 'articles'}
          </p>
        </div>

        {/* Grid */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          style={{ gap: template.spacing.cardGap }}
        >
          {articles.map((article) => (
            <CardComponent
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
    </div>
  );
}
