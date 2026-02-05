'use client';

import { CategoryLayoutProps } from '@/lib/templates/types';
import { OverlayCard } from '../cards/OverlayCard';
import { getCardComponent } from '../cards';

export function FeaturedGridLayout({ template, articles, locale, categoryName }: CategoryLayoutProps) {
  const colors = template.activeColors;
  const CardComponent = getCardComponent(template.layout.articleCard);
  
  const featuredArticle = articles[0];
  const secondaryArticles = articles.slice(1, 3);
  const remainingArticles = articles.slice(3);

  return (
    <div className="py-8">
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Category Header */}
        <div 
          className="mb-8 pb-4 border-b"
          style={{ borderColor: colors.border }}
        >
          <h1 
            className="text-3xl md:text-4xl font-bold"
            style={{ 
              fontFamily: template.typography.headingFont,
              fontWeight: template.typography.headingWeight,
              color: colors.text,
            }}
          >
            {categoryName}
          </h1>
        </div>

        {/* Featured Section */}
        {featuredArticle && (
          <div 
            className="mb-8 grid grid-cols-1 lg:grid-cols-2"
            style={{ gap: template.spacing.cardGap }}
          >
            {/* Main Featured */}
            <div className="lg:row-span-2">
              <OverlayCard
                article={featuredArticle}
                template={template}
                locale={locale}
                size="large"
              />
            </div>

            {/* Secondary Featured */}
            {secondaryArticles.map((article) => (
              <OverlayCard
                key={article.slug}
                article={article}
                template={template}
                locale={locale}
                size="medium"
              />
            ))}
          </div>
        )}

        {/* Section Divider */}
        {remainingArticles.length > 0 && (
          <div 
            className="flex items-center gap-4 mb-8"
          >
            <div 
              className="flex-1 h-px"
              style={{ backgroundColor: colors.border }}
            />
            <span 
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: colors.textMuted }}
            >
              {locale === 'de' ? 'Weitere Artikel' : 'More Articles'}
            </span>
            <div 
              className="flex-1 h-px"
              style={{ backgroundColor: colors.border }}
            />
          </div>
        )}

        {/* Remaining Articles Grid */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: template.spacing.cardGap }}
        >
          {remainingArticles.map((article) => (
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
