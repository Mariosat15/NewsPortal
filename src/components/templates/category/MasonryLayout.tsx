'use client';

import { CategoryLayoutProps } from '@/lib/templates/types';
import { getCardComponent } from '../cards';

export function MasonryLayout({ template, articles, locale, categoryName }: CategoryLayoutProps) {
  const colors = template.activeColors;
  const CardComponent = getCardComponent(template.layout.articleCard);

  // Distribute articles into columns
  const columnCount = 3;
  const columns: typeof articles[] = Array.from({ length: columnCount }, () => []);
  articles.forEach((article, i) => {
    columns[i % columnCount].push(article);
  });

  return (
    <div className="py-8">
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Category Header */}
        <div className="mb-8 text-center">
          <h1 
            className="text-4xl md:text-5xl font-bold mb-3"
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
            {locale === 'de' ? 'Entdecken Sie alle Artikel' : 'Discover all articles'}
          </p>
        </div>

        {/* Masonry Grid */}
        <div 
          className="hidden md:flex gap-6"
          style={{ gap: template.spacing.cardGap }}
        >
          {columns.map((column, colIndex) => (
            <div 
              key={colIndex} 
              className="flex-1 space-y-6"
              style={{ gap: template.spacing.cardGap }}
            >
              {column.map((article, artIndex) => (
                <div 
                  key={article.slug}
                  style={{ 
                    // Varied heights for masonry effect
                    marginTop: colIndex === 1 && artIndex === 0 ? '2rem' : '0',
                  }}
                >
                  <CardComponent
                    article={article}
                    template={template}
                    locale={locale}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Mobile: Single column */}
        <div 
          className="md:hidden space-y-4"
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
