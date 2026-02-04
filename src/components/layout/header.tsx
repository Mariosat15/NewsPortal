'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Menu, Search, Globe, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBrand } from '@/lib/brand/context';
import { cn } from '@/lib/utils';

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const brand = useBrand();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const otherLocale = locale === 'de' ? 'en' : 'de';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/${locale}/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center space-x-2 mx-2 md:mx-0">
          {brand.logoUrl ? (
            <Image
              src={brand.logoUrl}
              alt={brand.name}
              width={120}
              height={32}
              className="h-8 w-auto"
            />
          ) : (
            <span className="font-bold text-lg" style={{ color: brand.primaryColor }}>
              {brand.name}
            </span>
          )}
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-6 ml-6">
          <Link
            href={`/${locale}`}
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            {t('nav.home')}
          </Link>
          <Link
            href={`/${locale}/categories`}
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            {t('nav.categories')}
          </Link>
          {brand.features.trending && (
            <Link
              href={`/${locale}/trending`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t('nav.trending')}
            </Link>
          )}
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center space-x-2">
          {/* Search toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Language switcher */}
          <Link href={`/${otherLocale}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{otherLocale.toUpperCase()}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search bar (expandable) */}
      <div
        className={cn(
          'border-b bg-background overflow-hidden transition-all duration-200',
          isSearchOpen ? 'max-h-16 py-2' : 'max-h-0'
        )}
      >
        <form onSubmit={handleSearch} className="container px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('common.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </form>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'md:hidden border-b bg-background overflow-hidden transition-all duration-200',
          isMenuOpen ? 'max-h-64' : 'max-h-0'
        )}
      >
        <nav className="container px-4 py-4 flex flex-col space-y-4">
          <Link
            href={`/${locale}`}
            className="text-sm font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            {t('nav.home')}
          </Link>
          <Link
            href={`/${locale}/categories`}
            className="text-sm font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            {t('nav.categories')}
          </Link>
          {brand.features.trending && (
            <Link
              href={`/${locale}/trending`}
              className="text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.trending')}
            </Link>
          )}
          {brand.features.bookmarks && (
            <Link
              href={`/${locale}/bookmarks`}
              className="text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.bookmarks')}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
