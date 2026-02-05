'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, Search, ChevronDown } from 'lucide-react';
import { HeaderProps } from '@/lib/templates/types';

export function StandardHeader({ template, categories, locale, brandName, logoUrl }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const colors = template.activeColors;

  return (
    <header 
      className="sticky top-0 z-50 transition-all duration-200"
      style={{ 
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        height: template.spacing.headerHeight,
      }}
    >
      <div 
        className="mx-auto h-full flex items-center justify-between px-4"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center shrink-0">
          {logoUrl ? (
            <Image src={logoUrl} alt={brandName} width={140} height={40} className="h-8 w-auto" />
          ) : (
            <span 
              className="text-xl font-bold"
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

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {categories.filter(c => c.enabled).slice(0, 7).map((cat) => (
            <Link
              key={cat.slug}
              href={`/${locale}/categories/${cat.slug}`}
              className="px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-black/5"
              style={{ 
                color: colors.text,
                fontFamily: template.typography.bodyFont,
              }}
            >
              {cat.displayName[locale as 'de' | 'en'] || cat.displayName.de}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-md transition-colors hover:bg-black/5"
            style={{ color: colors.textMuted }}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md transition-colors hover:bg-black/5"
            style={{ color: colors.text }}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div 
          className="absolute top-full left-0 right-0 p-4 shadow-lg"
          style={{ backgroundColor: colors.surface }}
        >
          <div className="mx-auto" style={{ maxWidth: template.spacing.containerMax }}>
            <input
              type="search"
              placeholder={locale === 'de' ? 'Suchen...' : 'Search...'}
              className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2"
              style={{ 
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              }}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden absolute top-full left-0 right-0 shadow-lg"
          style={{ backgroundColor: colors.surface }}
        >
          <nav className="p-4 space-y-1">
            {categories.filter(c => c.enabled).map((cat) => (
              <Link
                key={cat.slug}
                href={`/${locale}/categories/${cat.slug}`}
                className="block px-4 py-3 rounded-lg transition-colors"
                style={{ color: colors.text }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {cat.displayName[locale as 'de' | 'en'] || cat.displayName.de}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
