'use client';

import NextLink from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { 
  Home, 
  Newspaper, 
  TrendingUp, 
  Bookmark, 
  User, 
  Settings,
  LogIn,
  LogOut,
  Globe,
  Search,
  X,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBrand } from '@/lib/brand/context';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  } | null;
}

export function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const brand = useBrand();
  const [searchQuery, setSearchQuery] = useState('');
  const otherLocale = locale === 'de' ? 'en' : 'de';
  
  // Get path without locale prefix for language switching
  const getPathWithoutLocale = () => {
    const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/';
    return pathWithoutLocale;
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const router = useRouter();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const navItems = [
    { href: '/', icon: Home, label: t('nav.home'), active: pathname === `/${locale}` || pathname === `/${locale}/` },
    { href: '/categories', icon: Newspaper, label: t('nav.categories'), active: pathname.includes('/categories') },
    ...(brand.features.trending ? [{ href: '/trending', icon: TrendingUp, label: t('nav.trending'), active: pathname.includes('/trending') }] : []),
    ...(brand.features.bookmarks ? [{ href: '/bookmarks', icon: Bookmark, label: t('nav.bookmarks'), active: pathname.includes('/bookmarks') }] : []),
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button (mobile only) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-800 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-3">
            {brand.logoUrl ? (
              <Image
                src={brand.logoUrl}
                alt={brand.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg bg-white p-1"
              />
            ) : (
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: brand.primaryColor }}
              >
                {brand.name.charAt(0)}
              </div>
            )}
            <span className="font-bold text-xl">{brand.name}</span>
          </Link>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder={t('common.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:ring-blue-500"
              />
            </div>
          </form>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    item.active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="my-6 border-t border-slate-800" />

          {/* User section */}
          <div className="space-y-1">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    pathname.includes('/profile')
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">{t('nav.profile') || 'Profile'}</span>
                </Link>
                <button
                  onClick={() => {
                    // TODO: Implement logout
                    window.location.href = '/api/auth/logout';
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">{t('auth.logout') || 'Logout'}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    pathname.includes('/login')
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <LogIn className="h-5 w-5" />
                  <span className="font-medium">{t('auth.login') || 'Login'}</span>
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    pathname.includes('/register')
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">{t('auth.register') || 'Register'}</span>
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-slate-800">
          {/* User info (if logged in) */}
          {user && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-slate-800">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {user.avatar ? (
                  <Image src={user.avatar} alt={user.name} width={40} height={40} className="rounded-full" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Language switcher */}
          <Link
            href={getPathWithoutLocale()}
            locale={otherLocale}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200"
          >
            <Globe className="h-5 w-5" />
            <span className="font-medium">
              {locale === 'de' ? 'English' : 'Deutsch'}
            </span>
            <span className="ml-auto text-xs bg-slate-700 px-2 py-1 rounded">
              {otherLocale.toUpperCase()}
            </span>
          </Link>
        </div>
      </aside>
    </>
  );
}
