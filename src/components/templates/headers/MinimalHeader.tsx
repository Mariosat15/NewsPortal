'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { HeaderProps } from '@/lib/templates/types';

export function MinimalHeader({ template, categories, locale, brandName, logoUrl }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const colors = template.activeColors;

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
            <Image src={logoUrl} alt={brandName} width={120} height={32} className="h-6 w-auto" />
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
        <nav className="hidden md:flex items-center gap-6">
          {categories.filter(c => c.enabled).slice(0, 5).map((cat) => (
            <Link
              key={cat.slug}
              href={`/${locale}/categories/${cat.slug}`}
              className="text-sm transition-colors hover:opacity-70"
              style={{ 
                color: colors.textMuted,
                fontFamily: template.typography.bodyFont,
              }}
            >
              {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
            </Link>
          ))}
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
