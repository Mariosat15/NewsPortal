'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Menu, Search, X, User, LogIn } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useBrand } from '@/lib/brand/context';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'home', href: '', labelDe: 'Start', labelEn: 'Home', isHome: true },
  { key: 'news', href: '/categories/news', labelDe: 'Nachrichten', labelEn: 'News' },
  { key: 'technology', href: '/categories/technology', labelDe: 'Technologie', labelEn: 'Tech' },
  { key: 'entertainment', href: '/categories/entertainment', labelDe: 'Unterhaltung', labelEn: 'Entertainment' },
  { key: 'sports', href: '/categories/sports', labelDe: 'Sport', labelEn: 'Sports' },
  { key: 'health', href: '/categories/health', labelDe: 'Gesundheit', labelEn: 'Health' },
  { key: 'finance', href: '/categories/finance', labelDe: 'Finanzen', labelEn: 'Business' },
];

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const brand = useBrand();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = `/${locale}`;
    } catch (error) {
      console.error('Logout error:', error);
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
              <Image
                src={brand.logoUrl}
                alt={brand.name}
                width={140}
                height={40}
                className="h-9 w-auto"
              />
            ) : (
              <span className="text-xl font-black tracking-tight text-gray-900">
                {brand.name}
              </span>
            )}
          </Link>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <Link 
                href={`/${locale}/profile`}
                className="p-2 text-gray-600 hover:text-[#e91e8c] transition-colors"
                aria-label="Profile"
              >
                <User className="h-5 w-5" />
              </Link>
            ) : (
              <Link 
                href={`/${locale}/login`}
                className="p-2 text-gray-600 hover:text-[#e91e8c] transition-colors"
                aria-label="Login"
              >
                <LogIn className="h-5 w-5" />
              </Link>
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

          <div className="p-4 border-t">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e91e8c] to-purple-600 flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/${locale}/profile`}
                    className="flex-1 py-2 px-3 text-sm text-center font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {locale === 'de' ? 'Profil' : 'Profile'}
                  </Link>
                  <button
                    onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                    className="flex-1 py-2 px-3 text-sm text-center font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    {locale === 'de' ? 'Abmelden' : 'Logout'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href={`/${locale}/login`}
                  className="block w-full py-2.5 px-4 bg-[#e91e8c] text-white text-center text-sm font-semibold rounded hover:bg-[#d11a7d]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {locale === 'de' ? 'Anmelden' : 'Login'}
                </Link>
                <Link
                  href={`/${locale}/register`}
                  className="block w-full py-2.5 px-4 border border-gray-300 text-gray-700 text-center text-sm font-medium rounded hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {locale === 'de' ? 'Registrieren' : 'Register'}
                </Link>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t">
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
