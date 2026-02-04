'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Globe } from 'lucide-react';
import { LandingPageLocale } from '@/lib/db/models/landing-page';

interface LanguageSwitcherProps {
  currentLocale: LandingPageLocale;
  slug: string;
  variant?: 'dropdown' | 'buttons' | 'minimal';
  className?: string;
}

const languages: { code: LandingPageLocale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

export function LanguageSwitcher({
  currentLocale,
  slug,
  variant = 'buttons',
  className = '',
}: LanguageSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const switchLanguage = (locale: LandingPageLocale) => {
    // Preserve existing query params
    const params = new URLSearchParams(searchParams.toString());
    params.set('locale', locale);
    
    // Navigate to the same page with new locale
    router.push(`/lp/${slug}?${params.toString()}`);
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => switchLanguage(lang.code)}
            className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
              currentLocale === lang.code
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title={lang.label}
          >
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative group ${className}`}>
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Globe className="h-4 w-4" />
          <span>{languages.find((l) => l.code === currentLocale)?.flag}</span>
          <span>{currentLocale.toUpperCase()}</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLanguage(lang.code)}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                currentLocale === lang.code ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {currentLocale === lang.code && (
                <svg className="h-4 w-4 ml-auto text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default: buttons variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-4 w-4 text-gray-500" />
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => switchLanguage(lang.code)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
            currentLocale === lang.code
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span>{lang.flag}</span>
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  );
}
