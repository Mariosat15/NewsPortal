'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { NavigationProps } from '@/lib/templates/types';

export function HorizontalNav({ template, categories, locale, currentCategory }: NavigationProps) {
  const colors = template.activeColors;

  return (
    <nav 
      className="border-b overflow-x-auto scrollbar-hide"
      style={{ 
        backgroundColor: colors.background,
        borderColor: colors.border,
      }}
    >
      <div 
        className="mx-auto px-4 flex items-center"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Home Link */}
        <Link
          href={`/${locale}`}
          className="shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors"
          style={{ 
            color: !currentCategory ? colors.accent : colors.text,
            borderColor: !currentCategory ? colors.accent : 'transparent',
            fontFamily: template.typography.bodyFont,
          }}
        >
          {locale === 'de' ? 'Startseite' : 'Home'}
        </Link>

        {/* Divider */}
        <ChevronRight className="w-4 h-4 mx-1 shrink-0" style={{ color: colors.border }} />

        {/* Categories */}
        {categories.filter(c => c.enabled).map((cat) => (
          <Link
            key={cat.slug}
            href={`/${locale}/categories/${cat.slug}`}
            className="shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
            style={{ 
              color: currentCategory === cat.slug ? colors.accent : colors.text,
              borderColor: currentCategory === cat.slug ? colors.accent : 'transparent',
              fontFamily: template.typography.bodyFont,
            }}
          >
            {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
          </Link>
        ))}
      </div>
    </nav>
  );
}
