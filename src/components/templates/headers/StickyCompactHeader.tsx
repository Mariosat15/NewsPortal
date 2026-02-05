'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Search, TrendingUp, Clock, ChevronDown } from 'lucide-react';
import { HeaderProps } from '@/lib/templates/types';

export function StickyCompactHeader({ template, categories, locale, brandName, logoUrl }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const colors = template.activeColors;

  const enabledCategories = categories.filter(c => c.enabled);
  const visibleCount = 10;
  const visibleCategories = enabledCategories.slice(0, visibleCount);
  const moreCategories = enabledCategories.slice(visibleCount);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentTime = new Date().toLocaleTimeString(locale === 'de' ? 'de-DE' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header 
      className="sticky top-0 z-50 transition-all duration-200"
      style={{ 
        backgroundColor: scrolled ? colors.surface : colors.background,
        boxShadow: scrolled ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      {/* Top Info Bar - Hides on scroll */}
      {!scrolled && (
        <div 
          className="border-b py-1.5 px-4"
          style={{ borderColor: colors.border }}
        >
          <div 
            className="mx-auto flex items-center justify-between text-xs"
            style={{ maxWidth: template.spacing.containerMax }}
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1" style={{ color: colors.textMuted }}>
                <Clock className="w-3 h-3" />
                {currentTime}
              </span>
              <span style={{ color: colors.textMuted }}>
                {new Date().toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { 
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link 
                href="#" 
                className="flex items-center gap-1 transition-colors hover:opacity-80"
                style={{ color: colors.accent }}
              >
                <TrendingUp className="w-3 h-3" />
                {locale === 'de' ? 'Märkte' : 'Markets'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Compact Header */}
      <div 
        className="border-b"
        style={{ borderColor: colors.border }}
      >
        <div 
          className="mx-auto px-4 flex items-center justify-between"
          style={{ 
            maxWidth: template.spacing.containerMax,
            height: template.spacing.headerHeight,
          }}
        >
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center shrink-0">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={brandName} 
                style={{ height: '40px', width: 'auto', maxWidth: '180px' }}
              />
            ) : (
              <span 
                className="text-lg font-bold tracking-tight"
                style={{ 
                  fontFamily: template.typography.headingFont,
                  color: colors.primary,
                }}
              >
                {brandName}
              </span>
            )}
          </Link>

          {/* Compact Navigation */}
          <nav className="hidden lg:flex items-center flex-wrap">
            {visibleCategories.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/${locale}/categories/${cat.slug}`}
                className="px-2 py-1 text-xs font-medium uppercase tracking-wider transition-colors border-r whitespace-nowrap"
                style={{ 
                  color: colors.text,
                  borderColor: colors.border,
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
                  className="px-2 py-1 text-xs font-medium uppercase tracking-wider flex items-center gap-1"
                  style={{ color: colors.text }}
                >
                  {locale === 'de' ? 'Mehr' : 'More'}
                  <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </button>
                {moreOpen && (
                  <div 
                    className="absolute top-full right-0 mt-1 py-2 rounded-lg shadow-lg min-w-[140px] z-50"
                    style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
                  >
                    {moreCategories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/${locale}/categories/${cat.slug}`}
                        className="block px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors hover:bg-black/5"
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

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button 
              className="p-1.5 rounded transition-colors"
              style={{ color: colors.textMuted }}
            >
              <Search className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5"
              style={{ color: colors.text }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden border-b"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <nav className="py-2">
            {categories.filter(c => c.enabled).map((cat) => (
              <Link
                key={cat.slug}
                href={`/${locale}/categories/${cat.slug}`}
                className="block px-4 py-2 text-sm font-medium"
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
