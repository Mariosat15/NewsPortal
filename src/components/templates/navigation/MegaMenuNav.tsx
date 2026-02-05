'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { NavigationProps } from '@/lib/templates/types';

export function MegaMenuNav({ template, categories, locale, currentCategory }: NavigationProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const colors = template.activeColors;

  // Group categories (first 4 in main nav, rest in "More")
  const mainCategories = categories.filter(c => c.enabled).slice(0, 5);
  const moreCategories = categories.filter(c => c.enabled).slice(5);

  return (
    <nav 
      className="relative border-b"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      <div 
        className="mx-auto px-4 flex items-center"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Main Categories */}
        {mainCategories.map((cat) => (
          <div 
            key={cat.slug}
            className="relative"
            onMouseEnter={() => setOpenMenu(cat.slug)}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <Link
              href={`/${locale}/categories/${cat.slug}`}
              className="flex items-center gap-1 px-4 py-4 text-sm font-semibold transition-colors"
              style={{ 
                color: currentCategory === cat.slug || openMenu === cat.slug ? colors.accent : colors.text,
                fontFamily: template.typography.bodyFont,
              }}
            >
              {cat.displayName[locale as 'de' | 'en'] || cat.displayName.de}
              {cat.aliases && cat.aliases.length > 0 && (
                <ChevronDown className="w-3 h-3" />
              )}
            </Link>

            {/* Dropdown for subcategories (aliases) */}
            {openMenu === cat.slug && cat.aliases && cat.aliases.length > 0 && (
              <div 
                className="absolute top-full left-0 min-w-[200px] py-2 shadow-lg z-50"
                style={{ 
                  backgroundColor: colors.surface,
                  borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.5rem',
                }}
              >
                {cat.aliases.map((alias) => (
                  <Link
                    key={alias}
                    href={`/${locale}/categories/${alias}`}
                    className="block px-4 py-2 text-sm transition-colors hover:bg-opacity-10"
                    style={{ 
                      color: colors.text,
                    }}
                  >
                    {alias.charAt(0).toUpperCase() + alias.slice(1).replace(/-/g, ' ')}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* More dropdown if extra categories */}
        {moreCategories.length > 0 && (
          <div 
            className="relative"
            onMouseEnter={() => setOpenMenu('more')}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button
              className="flex items-center gap-1 px-4 py-4 text-sm font-semibold transition-colors"
              style={{ 
                color: openMenu === 'more' ? colors.accent : colors.text,
                fontFamily: template.typography.bodyFont,
              }}
            >
              {locale === 'de' ? 'Mehr' : 'More'}
              <ChevronDown className="w-3 h-3" />
            </button>

            {openMenu === 'more' && (
              <div 
                className="absolute top-full right-0 min-w-[200px] py-2 shadow-lg z-50"
                style={{ 
                  backgroundColor: colors.surface,
                  borderRadius: template.features.roundedCorners === 'none' ? '0' : '0.5rem',
                }}
              >
                {moreCategories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/${locale}/categories/${cat.slug}`}
                    className="block px-4 py-2 text-sm transition-colors"
                    style={{ 
                      color: currentCategory === cat.slug ? colors.accent : colors.text,
                    }}
                  >
                    {cat.displayName[locale as 'de' | 'en'] || cat.displayName.de}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
