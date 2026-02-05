'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Home, ChevronRight } from 'lucide-react';
import { NavigationProps } from '@/lib/templates/types';

export function HamburgerNav({ template, categories, locale, currentCategory }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const colors = template.activeColors;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg transition-colors"
        style={{ 
          color: colors.text,
          backgroundColor: 'transparent',
        }}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Panel */}
      <aside 
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: colors.surface }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: colors.border }}
        >
          <span 
            className="text-lg font-bold"
            style={{ 
              fontFamily: template.typography.headingFont,
              color: colors.text,
            }}
          >
            {locale === 'de' ? 'Navigation' : 'Navigation'}
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg"
            style={{ color: colors.textMuted }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4">
          {/* Home */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors"
            style={{ 
              backgroundColor: !currentCategory ? colors.surfaceAlt : 'transparent',
              color: !currentCategory ? colors.accent : colors.text,
            }}
            onClick={() => setIsOpen(false)}
          >
            <Home className="w-5 h-5" />
            <span className="text-sm font-medium flex-1">
              {locale === 'de' ? 'Startseite' : 'Home'}
            </span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </Link>

          {/* Divider */}
          <div 
            className="my-4 border-t"
            style={{ borderColor: colors.border }}
          />

          {/* Categories */}
          <h3 
            className="text-xs font-bold uppercase tracking-wider mb-3 px-4"
            style={{ color: colors.textMuted }}
          >
            {locale === 'de' ? 'Kategorien' : 'Categories'}
          </h3>

          {categories.filter(c => c.enabled).map((cat) => (
            <Link
              key={cat.slug}
              href={`/${locale}/categories/${cat.slug}`}
              className="flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors"
              style={{ 
                backgroundColor: currentCategory === cat.slug ? colors.surfaceAlt : 'transparent',
                color: currentCategory === cat.slug ? colors.accent : colors.text,
              }}
              onClick={() => setIsOpen(false)}
            >
              <span 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cat.color || colors.accent }}
              />
              <span className="text-sm font-medium flex-1">
                {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
              </span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
