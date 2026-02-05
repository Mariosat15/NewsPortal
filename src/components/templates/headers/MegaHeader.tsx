'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, Search, ChevronDown, TrendingUp } from 'lucide-react';
import { HeaderProps } from '@/lib/templates/types';

export function MegaHeader({ template, categories, locale, brandName, logoUrl }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const colors = template.activeColors;

  return (
    <header className="z-50" style={{ backgroundColor: colors.surface }}>
      {/* Top Breaking News Bar */}
      <div 
        className="py-2 px-4"
        style={{ backgroundColor: colors.accent }}
      >
        <div 
          className="mx-auto flex items-center gap-3"
          style={{ maxWidth: template.spacing.containerMax }}
        >
          <span 
            className="px-2 py-0.5 text-xs font-bold uppercase rounded"
            style={{ backgroundColor: colors.background, color: colors.accent }}
          >
            {locale === 'de' ? 'AKTUELL' : 'LIVE'}
          </span>
          <span className="text-sm font-medium text-white truncate">
            {locale === 'de' ? 'Aktuelle Nachrichten und Updates' : 'Breaking news and live updates'}
          </span>
        </div>
      </div>

      {/* Main Header */}
      <div 
        className="border-b"
        style={{ borderColor: colors.border }}
      >
        <div 
          className="mx-auto px-4 py-3 flex items-center justify-between"
          style={{ maxWidth: template.spacing.containerMax }}
        >
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center">
            {logoUrl ? (
              <Image src={logoUrl} alt={brandName} width={180} height={50} className="h-12 w-auto" />
            ) : (
              <span 
                className="text-3xl"
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

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: colors.textMuted }}
              />
              <input
                type="search"
                placeholder={locale === 'de' ? 'Nachrichten suchen...' : 'Search news...'}
                className="w-full pl-10 pr-4 py-2 rounded-full text-sm border outline-none focus:ring-2"
                style={{ 
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button 
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              style={{ backgroundColor: colors.accent, color: 'white' }}
            >
              <TrendingUp className="w-4 h-4" />
              {locale === 'de' ? 'Trending' : 'Trending'}
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2"
              style={{ color: colors.text }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mega Navigation */}
      <nav 
        className="hidden lg:block border-b"
        style={{ backgroundColor: colors.background, borderColor: colors.border }}
      >
        <div 
          className="mx-auto px-4 flex items-center"
          style={{ maxWidth: template.spacing.containerMax }}
        >
          {categories.filter(c => c.enabled).slice(0, 8).map((cat) => (
            <div 
              key={cat.slug}
              className="relative"
              onMouseEnter={() => setActiveDropdown(cat.slug)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                href={`/${locale}/categories/${cat.slug}`}
                className="flex items-center gap-1 px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-colors border-b-2"
                style={{ 
                  color: activeDropdown === cat.slug ? colors.accent : colors.text,
                  borderColor: activeDropdown === cat.slug ? colors.accent : 'transparent',
                  fontFamily: template.typography.bodyFont,
                }}
              >
                {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
                <ChevronDown className="w-3 h-3" />
              </Link>
              
              {/* Dropdown */}
              {activeDropdown === cat.slug && (
                <div 
                  className="absolute top-full left-0 w-64 py-2 shadow-lg rounded-b-lg z-50"
                  style={{ backgroundColor: colors.surface }}
                >
                  {cat.aliases?.map((alias) => (
                    <Link
                      key={alias}
                      href={`/${locale}/categories/${alias}`}
                      className="block px-4 py-2 text-sm transition-colors"
                      style={{ color: colors.text }}
                    >
                      {alias.charAt(0).toUpperCase() + alias.slice(1)}
                    </Link>
                  ))}
                  {(!cat.aliases || cat.aliases.length === 0) && (
                    <span className="block px-4 py-2 text-sm" style={{ color: colors.textMuted }}>
                      {locale === 'de' ? 'Alle Artikel anzeigen' : 'View all articles'}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden border-t"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          {/* Mobile Search */}
          <div className="p-4">
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: colors.textMuted }}
              />
              <input
                type="search"
                placeholder={locale === 'de' ? 'Suchen...' : 'Search...'}
                className="w-full pl-10 pr-4 py-3 rounded-lg border"
                style={{ 
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
            </div>
          </div>
          
          <nav className="px-2 pb-4">
            {categories.filter(c => c.enabled).map((cat) => (
              <Link
                key={cat.slug}
                href={`/${locale}/categories/${cat.slug}`}
                className="block px-4 py-3 rounded-lg text-sm font-semibold uppercase tracking-wide"
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
