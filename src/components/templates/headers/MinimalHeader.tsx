'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { HeaderProps } from '@/lib/templates/types';

export function MinimalHeader({ template, categories, locale, brandName, logoUrl }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const colors = template.activeColors;

  const enabledCategories = categories.filter(c => c.enabled);
  const visibleCount = 8; // Show more in minimal
  const visibleCategories = enabledCategories.slice(0, visibleCount);
  const moreCategories = enabledCategories.slice(visibleCount);

  return (
    <header 
      className="z-50"
      style={{ 
        backgroundColor: colors.background,
        height: template.spacing.headerHeight,
      }}
    >
      <div 
        className="mx-auto h-full flex items-center justify-between px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center">
          {logoUrl ? (
            <img src={logoUrl} alt={brandName} style={{ height: '44px', width: 'auto', maxWidth: '200px' }} />
          ) : (
            <span 
              className="text-lg tracking-tight"
              style={{ 
                fontFamily: template.typography.headingFont,
                fontWeight: template.typography.headingWeight,
                color: colors.text,
              }}
            >
              {brandName}
            </span>
          )}
        </Link>

        {/* Desktop Navigation - Minimal */}
        <nav className="hidden md:flex items-center gap-4">
          {visibleCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${locale}/categories/${cat.slug}`}
              className="text-sm transition-colors hover:opacity-70 whitespace-nowrap"
              style={{ 
                color: colors.textMuted,
                fontFamily: template.typography.bodyFont,
              }}
            >
              {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
            </Link>
          ))}
          {moreCategories.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                onBlur={() => setTimeout(() => setMoreOpen(false), 150)}
                className="text-sm transition-colors hover:opacity-70 flex items-center gap-1"
                style={{ color: colors.textMuted }}
              >
                {locale === 'de' ? 'Mehr' : 'More'}
                <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <div 
                  className="absolute top-full right-0 mt-2 py-2 rounded-lg shadow-lg min-w-[160px] z-50"
                  style={{ backgroundColor: colors.background, border: `1px solid ${colors.border}` }}
                >
                  {moreCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/${locale}/categories/${cat.slug}`}
                      className="block px-4 py-2 text-sm transition-colors hover:opacity-70"
                      style={{ color: colors.text }}
                    >
                      {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden"
          style={{ color: colors.text }}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu - Minimal */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 pt-14"
          style={{ backgroundColor: colors.background }}
        >
          <nav className="flex flex-col items-center justify-center h-full gap-6">
            {categories.filter(c => c.enabled).map((cat) => (
              <Link
                key={cat.slug}
                href={`/${locale}/categories/${cat.slug}`}
                className="text-2xl transition-opacity hover:opacity-70"
                style={{ 
                  color: colors.text,
                  fontFamily: template.typography.headingFont,
                }}
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
