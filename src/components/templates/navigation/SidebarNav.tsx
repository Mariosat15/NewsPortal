'use client';

import Link from 'next/link';
import { Home, ChevronRight, TrendingUp } from 'lucide-react';
import { NavigationProps } from '@/lib/templates/types';

export function SidebarNav({ template, categories, locale, currentCategory }: NavigationProps) {
  const colors = template.activeColors;

  return (
    <aside 
      className="w-64 shrink-0 border-r h-full py-6 px-4"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      {/* Trending Section */}
      <div className="mb-6">
        <h3 
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-3 px-3"
          style={{ color: colors.textMuted }}
        >
          <TrendingUp className="w-4 h-4" style={{ color: colors.accent }} />
          {locale === 'de' ? 'Trending' : 'Trending'}
        </h3>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {/* Home */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
          style={{ 
            backgroundColor: !currentCategory ? colors.surfaceAlt : 'transparent',
            color: !currentCategory ? colors.accent : colors.text,
          }}
        >
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium">
            {locale === 'de' ? 'Startseite' : 'Home'}
          </span>
        </Link>

        {/* Section Divider */}
        <div 
          className="my-4 mx-3 border-t"
          style={{ borderColor: colors.border }}
        />

        {/* Categories Label */}
        <h3 
          className="text-xs font-bold uppercase tracking-wider mb-3 px-3"
          style={{ color: colors.textMuted }}
        >
          {locale === 'de' ? 'Kategorien' : 'Categories'}
        </h3>

        {/* Category Links */}
        {categories.filter(c => c.enabled).map((cat) => (
          <Link
            key={cat.slug}
            href={`/${locale}/categories/${cat.slug}`}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            style={{ 
              backgroundColor: currentCategory === cat.slug ? colors.surfaceAlt : 'transparent',
              color: currentCategory === cat.slug ? colors.accent : colors.text,
            }}
          >
            {/* Category Icon/Color Indicator */}
            <span 
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: cat.color || colors.accent }}
            />
            <span className="text-sm font-medium flex-1">
              {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
            </span>
            <ChevronRight 
              className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: colors.textMuted }}
            />
          </Link>
        ))}
      </nav>
    </aside>
  );
}
