'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Search, ChevronDown } from 'lucide-react';
import { HeaderProps } from '@/lib/templates/types';

export function SplitHeader({ template, categories, locale, brandName, logoUrl }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const colors = template.activeColors;

  const enabledCategories = categories.filter(c => c.enabled);
  const halfCount = Math.min(6, Math.ceil(enabledCategories.length / 2));
  const leftCategories = enabledCategories.slice(0, halfCount);
  const rightCategories = enabledCategories.slice(halfCount, halfCount * 2);
  const moreCategories = enabledCategories.slice(halfCount * 2);

  return (
    <header 
      className="sticky top-0 z-50"
      style={{ 
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div 
        className="mx-auto px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        <div 
          className="flex items-center justify-between"
          style={{ height: template.spacing.headerHeight }}
        >
          {/* Left Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {leftCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${locale}/categories/${cat.slug}`}
                className="px-3 py-2 text-sm font-medium transition-colors"
                style={{ 
                  color: colors.text,
                  fontFamily: template.typography.bodyFont,
                }}
              >
                {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
              </Link>
            ))}
          </nav>

          {/* Center Logo */}
          <Link 
            href={`/${locale}`} 
            className="flex items-center justify-center shrink-0 px-8"
          >
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} style={{ height: '50px', width: 'auto', maxWidth: '240px' }} />
            ) : (
              <span 
                className="text-2xl"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  fontWeight: template.typography.headingWeight,
                  color: colors.primary,
                }}
              >
                {brandName}
              </span>
            )}
          </Link>

          {/* Right Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-end">
            {rightCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${locale}/categories/${cat.slug}`}
                className="px-2 py-2 text-sm font-medium transition-colors whitespace-nowrap"
                style={{ 
                  color: colors.text,
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
                  className="px-2 py-2 text-sm font-medium flex items-center gap-1"
                  style={{ color: colors.text }}
                >
                  {locale === 'de' ? 'Mehr' : 'More'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
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
                        className="block px-4 py-2 text-sm transition-colors hover:bg-black/5"
                        style={{ color: colors.text }}
                      >
                        {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button 
              className="ml-2 p-2 rounded-full transition-colors"
              style={{ color: colors.textMuted }}
            >
              <Search className="w-5 h-5" />
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2"
            style={{ color: colors.text }}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden border-t"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <nav className="p-4 space-y-1">
            {categories.filter(c => c.enabled).map((cat) => (
              <Link
                key={cat.slug}
                href={`/${locale}/categories/${cat.slug}`}
                className="block px-4 py-3 rounded-lg"
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
