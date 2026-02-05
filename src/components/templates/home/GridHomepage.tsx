'use client';

import { HomeLayoutProps } from '@/lib/templates/types';
import { getCardComponent } from '../cards';

export function GridHomepage({ template, articles, categories, locale }: HomeLayoutProps) {
  const colors = template.activeColors;
  const CardComponent = getCardComponent(template.layout.articleCard);

  return (
    <div className="py-8">
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Category Filter Bar */}
        <div 
          className="flex items-center gap-2 mb-8 overflow-x-auto pb-2"
        >
          <button
            className="shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors"
            style={{ 
              backgroundColor: colors.accent,
              color: 'white',
            }}
          >
            {locale === 'de' ? 'Alle' : 'All'}
          </button>
          {categories.filter(c => c.enabled).slice(0, 6).map((cat) => (
            <a
              key={cat.slug}
              href={`/${locale}/categories/${cat.slug}`}
              className="shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors"
              style={{ 
                backgroundColor: colors.surfaceAlt,
                color: colors.text,
              }}
            >
              {cat.displayName[locale as 'de' | 'en'] || cat.displayName.de}
            </a>
          ))}
        </div>

        {/* Main Grid */}
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

        {/* Load More */}
        {articles.length >= 12 && (
          <div className="text-center mt-12">
            <button
              className="px-8 py-3 text-sm font-semibold rounded-full transition-colors"
              style={{ 
                backgroundColor: colors.accent,
                color: 'white',
              }}
            >
              {locale === 'de' ? 'Mehr laden' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
