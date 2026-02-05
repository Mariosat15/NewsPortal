'use client';

import Link from 'next/link';
import { useState } from 'react';
import { NavigationProps } from '@/lib/templates/types';

export function TabbedNav({ template, categories, locale, currentCategory }: NavigationProps) {
  const colors = template.activeColors;
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const enabledCategories = categories.filter(c => c.enabled);

  return (
    <nav 
      className="border-b"
      style={{ 
        backgroundColor: colors.background,
        borderColor: colors.border,
      }}
    >
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Tabs Container */}
        <div className="flex items-end overflow-x-auto scrollbar-hide -mb-px">
          {/* Home Tab */}
          <Link
            href={`/${locale}`}
            className="relative shrink-0 px-6 py-3 text-sm font-semibold transition-all"
            style={{ 
              color: !currentCategory ? colors.accent : colors.text,
              fontFamily: template.typography.bodyFont,
            }}
            onMouseEnter={() => setHoveredTab('home')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            {locale === 'de' ? 'Startseite' : 'Home'}
            
            {/* Active/Hover indicator */}
            <span 
              className="absolute bottom-0 left-0 right-0 h-0.5 transition-transform origin-left"
              style={{ 
                backgroundColor: colors.accent,
                transform: !currentCategory || hoveredTab === 'home' ? 'scaleX(1)' : 'scaleX(0)',
              }}
            />
          </Link>

          {/* Category Tabs */}
          {enabledCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${locale}/categories/${cat.slug}`}
              className="relative shrink-0 px-6 py-3 text-sm font-semibold transition-all whitespace-nowrap"
              style={{ 
                color: currentCategory === cat.slug ? colors.accent : colors.text,
                fontFamily: template.typography.bodyFont,
              }}
              onMouseEnter={() => setHoveredTab(cat.slug)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              {cat.displayName[locale as 'de' | 'en'] || cat.displayName.de}
              
              {/* Active/Hover indicator */}
              <span 
                className="absolute bottom-0 left-0 right-0 h-0.5 transition-transform origin-left"
                style={{ 
                  backgroundColor: colors.accent,
                  transform: currentCategory === cat.slug || hoveredTab === cat.slug ? 'scaleX(1)' : 'scaleX(0)',
                }}
              />
            </Link>
          ))}
        </div>

        {/* Optional secondary row for subcategories/aliases */}
        {currentCategory && (
          <div className="py-2 border-t" style={{ borderColor: colors.border }}>
            {(() => {
              const currentCat = categories.find(c => c.slug === currentCategory);
              if (!currentCat?.aliases?.length) return null;
              
              return (
                <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
                  {currentCat.aliases.map((alias) => (
                    <Link
                      key={alias}
                      href={`/${locale}/categories/${alias}`}
                      className="shrink-0 text-xs font-medium transition-colors"
                      style={{ color: colors.textMuted }}
                    >
                      {alias.charAt(0).toUpperCase() + alias.slice(1).replace(/-/g, ' ')}
                    </Link>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </nav>
  );
}
