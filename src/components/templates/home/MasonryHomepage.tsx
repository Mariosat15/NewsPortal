'use client';

import { HomeLayoutProps } from '@/lib/templates/types';
import { OverlayCard } from '../cards/OverlayCard';
import { BoldCard } from '../cards/BoldCard';
import { StandardCard } from '../cards/StandardCard';

export function MasonryHomepage({ template, articles, locale }: HomeLayoutProps) {
  const colors = template.activeColors;

  // Create varied layout pattern
  const heroArticles = articles.slice(0, 2);
  const columnArticles = articles.slice(2);
  
  // Distribute into 3 columns with varied heights
  const col1 = columnArticles.filter((_, i) => i % 3 === 0);
  const col2 = columnArticles.filter((_, i) => i % 3 === 1);
  const col3 = columnArticles.filter((_, i) => i % 3 === 2);

  return (
    <div className="py-8">
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Hero Row */}
        {heroArticles.length > 0 && (
          <section 
            className="grid grid-cols-1 md:grid-cols-2 mb-8"
            style={{ gap: template.spacing.cardGap }}
          >
            {heroArticles.map((article, i) => (
              <OverlayCard
                key={article.slug}
                article={article}
                template={template}
                locale={locale}
                size={i === 0 ? 'large' : 'medium'}
              />
            ))}
          </section>
        )}

        {/* Section Title */}
        <div className="flex items-center gap-4 mb-8">
          <div 
            className="flex-1 h-px"
            style={{ backgroundColor: colors.border }}
          />
          <h2 
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: colors.textMuted }}
          >
            {locale === 'de' ? 'Alle Geschichten' : 'All Stories'}
          </h2>
          <div 
            className="flex-1 h-px"
            style={{ backgroundColor: colors.border }}
          />
        </div>

        {/* Masonry Grid */}
        <div 
          className="hidden md:grid grid-cols-3"
          style={{ gap: template.spacing.cardGap }}
        >
          {/* Column 1 */}
          <div className="space-y-6">
            {col1.map((article, i) => (
              i % 3 === 0 ? (
                <BoldCard
                  key={article.slug}
                  article={article}
                  template={template}
                  locale={locale}
                />
              ) : (
                <StandardCard
                  key={article.slug}
                  article={article}
                  template={template}
                  locale={locale}
                />
              )
            ))}
          </div>

          {/* Column 2 - offset */}
          <div className="space-y-6 mt-12">
            {col2.map((article, i) => (
              i % 2 === 1 ? (
                <BoldCard
                  key={article.slug}
                  article={article}
                  template={template}
                  locale={locale}
                />
              ) : (
                <StandardCard
                  key={article.slug}
                  article={article}
                  template={template}
                  locale={locale}
                />
              )
            ))}
          </div>

          {/* Column 3 */}
          <div className="space-y-6 mt-6">
            {col3.map((article, i) => (
              i % 4 === 0 ? (
                <BoldCard
                  key={article.slug}
                  article={article}
                  template={template}
                  locale={locale}
                />
              ) : (
                <StandardCard
                  key={article.slug}
                  article={article}
                  template={template}
                  locale={locale}
                />
              )
            ))}
          </div>
        </div>

        {/* Mobile: Simple grid */}
        <div 
          className="md:hidden grid grid-cols-1 sm:grid-cols-2"
          style={{ gap: template.spacing.cardGap }}
        >
          {columnArticles.map((article) => (
            <StandardCard
              key={article.slug}
              article={article}
              template={template}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
