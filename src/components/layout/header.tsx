'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Menu, Search, X, Wifi, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useBrand } from '@/lib/brand/context';
import { cn } from '@/lib/utils';

// Category name translations
const categoryTranslations: Record<string, { de: string; en: string }> = {
  news: { de: 'Nachrichten', en: 'News' },
  technology: { de: 'Technologie', en: 'Tech' },
  health: { de: 'Gesundheit', en: 'Health' },
  finance: { de: 'Finanzen', en: 'Finance' },
  sports: { de: 'Sport', en: 'Sports' },
  lifestyle: { de: 'Lifestyle', en: 'Lifestyle' },
  entertainment: { de: 'Unterhaltung', en: 'Entertainment' },
  recipes: { de: 'Rezepte', en: 'Recipes' },
  relationships: { de: 'Beziehungen', en: 'Relationships' },
  travel: { de: 'Reisen', en: 'Travel' },
  science: { de: 'Wissenschaft', en: 'Science' },
  culture: { de: 'Kultur', en: 'Culture' },
  music: { de: 'Musik', en: 'Music' },
  business: { de: 'Wirtschaft', en: 'Business' },
};

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface NavItem {
  key: string;
  href: string;
  labelDe: string;
  labelEn: string;
  isHome?: boolean;
}

// Default fallback items if API fails
const defaultNavItems: NavItem[] = [
  { key: 'home', href: '', labelDe: 'Start', labelEn: 'Home', isHome: true },
  { key: 'news', href: '/categories/news', labelDe: 'Nachrichten', labelEn: 'News' },
  { key: 'technology', href: '/categories/technology', labelDe: 'Technologie', labelEn: 'Tech' },
  { key: 'entertainment', href: '/categories/entertainment', labelDe: 'Unterhaltung', labelEn: 'Entertainment' },
  { key: 'sports', href: '/categories/sports', labelDe: 'Sport', labelEn: 'Sports' },
  { key: 'health', href: '/categories/health', labelDe: 'Gesundheit', labelEn: 'Health' },
  { key: 'finance', href: '/categories/finance', labelDe: 'Finanzen', labelEn: 'Finance' },
];

interface NetworkInfo {
  networkType: 'MOBILE_DATA' | 'WIFI' | 'UNKNOWN';
  isMobileNetwork: boolean;
  carrier?: {
    name: string;
  };
}

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const brand = useBrand();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [navItems, setNavItems] = useState<NavItem[]>(defaultNavItems);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  // Fetch enabled categories from API
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          if (data.categories && data.categories.length > 0) {
            // Build nav items from categories
            const items: NavItem[] = [
              { key: 'home', href: '', labelDe: 'Start', labelEn: 'Home', isHome: true },
            ];
            
            data.categories.forEach((cat: Category) => {
              const translation = categoryTranslations[cat.slug] || { de: cat.name, en: cat.name };
              items.push({
                key: cat.slug,
                href: `/categories/${cat.slug}`,
                labelDe: translation.de,
                labelEn: translation.en,
              });
            });
            
            setNavItems(items);
          }
        }
      } catch (error) {
        console.error('Failed to load categories for nav:', error);
        // Keep default items on error
      }
    }
    
    loadCategories();
  }, []);

  // Detect network type for display
  useEffect(() => {
    async function detectNetwork() {
      try {
        const response = await fetch('/api/network/detect');
        if (response.ok) {
          const data = await response.json();
          setNetworkInfo(data);
        }
      } catch (error) {
        console.error('Failed to detect network:', error);
      }
    }
    
    detectNetwork();
    // Re-check network every 30 seconds
    const interval = setInterval(detectNetwork, 30000);
    return () => clearInterval(interval);
  }, []);

  const otherLocale = locale === 'de' ? 'en' : 'de';

  const isActive = (item: typeof navItems[0]) => {
    if (item.isHome) {
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    return pathname.includes(item.href);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/${locale}/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };


  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Main Header Row */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left - Mobile Menu Button (hidden on desktop) */}
          <button
            className="lg:hidden p-2 text-gray-600 hover:text-[#e91e8c] transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Spacer for desktop */}
          <div className="hidden lg:block w-10" />

          {/* Center - Logo */}
          <Link href={`/${locale}`} className="flex items-center">
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-12 w-auto max-w-[220px] object-contain"
                onError={(e) => {
                  // If logo fails to load, hide it and show text instead
                  (e.target as HTMLImageElement).style.display = 'none';
                  const textEl = (e.target as HTMLImageElement).nextElementSibling;
                  if (textEl) (textEl as HTMLElement).style.display = 'block';
                }}
              />
            ) : null}
            <span 
              className="text-xl font-black tracking-tight text-gray-900"
              style={{ display: brand.logoUrl ? 'none' : 'block' }}
            >
              {brand.name}
            </span>
          </Link>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            {/* Network Indicator */}
            {networkInfo && (
              <div 
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: networkInfo.isMobileNetwork ? '#dcfce7' : '#fef3c7',
                  color: networkInfo.isMobileNetwork ? '#15803d' : '#92400e',
                }}
                title={networkInfo.carrier ? `${networkInfo.carrier.name}` : networkInfo.networkType}
              >
                {networkInfo.isMobileNetwork ? (
                  <Smartphone className="h-3.5 w-3.5" />
                ) : (
                  <Wifi className="h-3.5 w-3.5" />
                )}
                <span className="hidden lg:inline">
                  {networkInfo.isMobileNetwork 
                    ? (locale === 'de' ? 'Mobil' : 'Mobile')
                    : 'WiFi'
                  }
                </span>
              </div>
            )}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-gray-600 hover:text-[#e91e8c] transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation - Single nav bar */}
      <nav className="hidden lg:block border-t border-gray-100 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.isHome ? `/${locale}` : `/${locale}${item.href}`}
                className={cn(
                  'px-4 py-3 text-[13px] font-semibold uppercase tracking-wide transition-colors relative',
                  isActive(item)
                    ? 'text-[#e91e8c]'
                    : 'text-gray-600 hover:text-[#e91e8c]'
                )}
              >
                {locale === 'de' ? item.labelDe : item.labelEn}
                {isActive(item) && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#e91e8c]" />
                )}
              </Link>
            ))}
            <Link 
              href={`/${otherLocale}`}
              className="ml-4 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-[#e91e8c] border border-gray-300 rounded transition-colors"
            >
              {otherLocale.toUpperCase()}
            </Link>
          </div>
        </div>
      </nav>

      {/* Search bar (expandable) */}
      <div
        className={cn(
          'bg-white border-t overflow-hidden transition-all duration-300',
          isSearchOpen ? 'max-h-16 py-3' : 'max-h-0'
        )}
      >
        <form onSubmit={handleSearch} className="container mx-auto px-4">
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder={t('common.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-11 h-10 text-sm bg-gray-50 border-gray-200 focus:border-[#e91e8c] focus:ring-[#e91e8c]"
              autoFocus={isSearchOpen}
            />
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Mobile Slide-out Menu */}
      <>
        <div
          className={cn(
            'fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300',
            isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setIsMenuOpen(false)}
        />
        
        <div
          className={cn(
            'fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-xl transform transition-transform duration-300 lg:hidden',
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <span className="font-bold text-lg text-gray-900">{brand.name}</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="p-4">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.isHome ? `/${locale}` : `/${locale}${item.href}`}
                className={cn(
                  'block py-3 text-sm font-medium border-b border-gray-100',
                  isActive(item) ? 'text-[#e91e8c]' : 'text-gray-700 hover:text-[#e91e8c]'
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {locale === 'de' ? item.labelDe : item.labelEn}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t space-y-4">
            {/* Network Status */}
            {networkInfo && (
              <div 
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                style={{
                  backgroundColor: networkInfo.isMobileNetwork ? '#dcfce7' : '#fef3c7',
                  color: networkInfo.isMobileNetwork ? '#15803d' : '#92400e',
                }}
              >
                {networkInfo.isMobileNetwork ? (
                  <Smartphone className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <Wifi className="h-4 w-4 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium">
                    {networkInfo.isMobileNetwork 
                      ? (locale === 'de' ? 'Mobile Daten' : 'Mobile Data')
                      : 'WiFi'
                    }
                  </p>
                  {networkInfo.carrier && networkInfo.isMobileNetwork && (
                    <p className="text-xs opacity-75">{networkInfo.carrier.name}</p>
                  )}
                  {!networkInfo.isMobileNetwork && (
                    <p className="text-xs opacity-75">
                      {locale === 'de' 
                        ? 'Mobile Daten benötigt für Käufe'
                        : 'Mobile data required for purchases'
                      }
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Language Switcher */}
            <div className="pt-2 border-t">
              <Link
                href={`/${otherLocale}`}
                className="text-sm text-gray-600 hover:text-[#e91e8c]"
                onClick={() => setIsMenuOpen(false)}
              >
                {locale === 'de' ? '🇬🇧 English' : '🇩🇪 Deutsch'}
              </Link>
            </div>
          </div>
        </div>
      </>
    </header>
  );
}
