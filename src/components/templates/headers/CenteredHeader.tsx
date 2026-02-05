'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Search, ChevronDown } from 'lucide-react';
import { HeaderProps } from '@/lib/templates/types';

export function CenteredHeader({ template, categories, locale, brandName, logoUrl }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const colors = template.activeColors;

  const enabledCategories = categories.filter(c => c.enabled);
  const visibleCount = 10;
  const visibleCategories = enabledCategories.slice(0, visibleCount);
  const moreCategories = enabledCategories.slice(visibleCount);

  return (
    <header 
      className="z-50"
      style={{ backgroundColor: colors.surface }}
    >
      {/* Top Bar with Search */}
      <div 
        className="border-b flex items-center justify-between px-4 py-2"
        style={{ borderColor: colors.border }}
      >
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <button 
            className="flex items-center gap-2 text-sm"
            style={{ color: colors.textMuted }}
          >
            <Search className="w-4 h-4" />
            {locale === 'de' ? 'Suchen' : 'Search'}
          </button>
        </div>
      </div>

      {/* Logo Centered */}
      <div className="py-8 text-center">
        <Link href={`/${locale}`}>
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} style={{ height: '56px', width: 'auto', maxWidth: '280px', margin: '0 auto' }} />
          ) : (
            <h1 
              style={{ 
                fontFamily: template.typography.headingFont,
                fontWeight: template.typography.headingWeight,
                color: colors.primary,
                fontSize: '2.5rem',
                letterSpacing: '-0.02em',
              }}
            >
              {brandName}
            </h1>
          )}
        </Link>
      </div>

      {/* Navigation Bar */}
      <nav 
        className="border-t border-b"
        style={{ borderColor: colors.border }}
      >
        <div 
          className="mx-auto flex items-center justify-center"
          style={{ maxWidth: template.spacing.containerMax }}
        >
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center flex-wrap justify-center">
            {visibleCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${locale}/categories/${cat.slug}`}
                className="relative px-3 py-4 text-xs font-medium uppercase tracking-wider transition-colors group whitespace-nowrap"
                style={{ 
                  color: colors.text,
                  fontFamily: template.typography.bodyFont,
                }}
              >
                {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
                <span 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 transition-all group-hover:w-full"
                  style={{ backgroundColor: colors.accent }}
                />
              </Link>
            ))}
            {moreCategories.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  onBlur={() => setTimeout(() => setMoreOpen(false), 150)}
                  className="relative px-3 py-4 text-xs font-medium uppercase tracking-wider flex items-center gap-1"
                  style={{ color: colors.text }}
                >
                  {locale === 'de' ? 'Mehr' : 'More'}
                  <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </button>
                {moreOpen && (
                  <div 
                    className="absolute top-full right-0 mt-1 py-2 rounded-lg shadow-lg min-w-[160px] z-50"
                    style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
                  >
                    {moreCategories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/${locale}/categories/${cat.slug}`}
                        className="block px-4 py-2 text-sm uppercase tracking-wider transition-colors hover:bg-black/5"
                        style={{ color: colors.text }}
                      >
                        {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-4"
            style={{ color: colors.text }}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden border-b"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <nav className="py-2">
            {categories.filter(c => c.enabled).map((cat) => (
              <Link
                key={cat.slug}
                href={`/${locale}/categories/${cat.slug}`}
                className="block px-6 py-3 text-sm uppercase tracking-wider"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
