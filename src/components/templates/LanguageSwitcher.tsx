'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { ResolvedTemplate } from '@/lib/templates/types';

interface LanguageSwitcherProps {
  locale: string;
  /** Optional: use template colors for styling */
  template?: ResolvedTemplate;
  /** Display variant */
  variant?: 'icon' | 'text' | 'full';
  /** Additional CSS class */
  className?: string;
}

const languages: { code: string; label: string; flag: string }[] = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

/**
 * Language switcher for the template system.
 * Replaces the locale segment in the current URL path.
 * 
 * Supports three variants:
 * - "icon": Just a globe icon + current language code (compact, for headers)
 * - "text": Flag + language name toggle (for mobile menus)
 * - "full": Both language buttons side by side (for footers)
 */
export function LanguageSwitcher({
  locale,
  template,
  variant = 'icon',
  className = '',
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const colors = template?.activeColors;

  // Build the URL for the other locale by replacing /de/ or /en/ in the path
  const otherLocale = locale === 'de' ? 'en' : 'de';
  const otherPath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  if (variant === 'text') {
    // Simple text link: "🇬🇧 English" or "🇩🇪 Deutsch"
    const other = languages.find((l) => l.code === otherLocale)!;
    return (
      <Link
        href={otherPath}
        className={`flex items-center gap-2 text-sm transition-colors hover:opacity-80 ${className}`}
        style={colors ? { color: colors.text } : undefined}
      >
        <span>{other.flag}</span>
        <span>{other.label}</span>
      </Link>
    );
  }

  if (variant === 'full') {
    // Both language buttons side by side
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {languages.map((lang) => {
          const langPath = pathname.replace(`/${locale}`, `/${lang.code}`);
          const isActive = locale === lang.code;
          return (
            <Link
              key={lang.code}
              href={langPath}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'
              }`}
              style={colors ? {
                color: isActive ? colors.primary : colors.textMuted,
                backgroundColor: isActive ? `${colors.primary}15` : 'transparent',
              } : undefined}
            >
              {lang.flag} {lang.code.toUpperCase()}
            </Link>
          );
        })}
      </div>
    );
  }

  // Default: icon variant — compact globe button + toggle
  return (
    <Link
      href={otherPath}
      className={`flex items-center gap-1.5 p-2 text-sm rounded-md transition-colors hover:bg-black/5 ${className}`}
      style={colors ? { color: colors.textMuted } : undefined}
      title={locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
    >
      <Globe className="w-4 h-4" />
      <span className="text-xs font-medium uppercase">{otherLocale}</span>
    </Link>
  );
}

export default LanguageSwitcher;
