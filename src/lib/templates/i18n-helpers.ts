/**
 * Centralized i18n helpers for template components.
 * 
 * Provides category translation and safe date formatting
 * for card components and layouts that don't have access
 * to the full categories config from the database.
 */

// Reason: Cards and category layouts receive article.category as an English slug
// but don't have the categories prop to look up display names. This map provides
// a static fallback so every component can translate categories without extra props.
const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  de: {
    technology: 'Technologie',
    health: 'Gesundheit',
    finance: 'Finanzen',
    sports: 'Sport',
    lifestyle: 'Lifestyle',
    news: 'Nachrichten',
    entertainment: 'Unterhaltung',
    world: 'Welt',
    politics: 'Politik',
    business: 'Wirtschaft',
    recipes: 'Rezepte',
    relationships: 'Beziehungen',
    travel: 'Reisen',
    science: 'Wissenschaft',
    culture: 'Kultur',
    music: 'Musik',
    education: 'Bildung',
    environment: 'Umwelt',
    automotive: 'Automobil',
    food: 'Essen',
    fashion: 'Mode',
    gaming: 'Gaming',
    opinion: 'Meinung',
  },
  en: {
    technology: 'Technology',
    health: 'Health',
    finance: 'Finance',
    sports: 'Sports',
    lifestyle: 'Lifestyle',
    news: 'News',
    entertainment: 'Entertainment',
    world: 'World',
    politics: 'Politics',
    business: 'Business',
    recipes: 'Recipes',
    relationships: 'Relationships',
    travel: 'Travel',
    science: 'Science',
    culture: 'Culture',
    music: 'Music',
    education: 'Education',
    environment: 'Environment',
    automotive: 'Automotive',
    food: 'Food',
    fashion: 'Fashion',
    gaming: 'Gaming',
    opinion: 'Opinion',
  },
};

/**
 * Translate a category slug to a localized display name.
 * Falls back to capitalizing the slug if no translation is found.
 * 
 * @param slug - Category slug (e.g., "technology")
 * @param locale - Locale code (e.g., "de" or "en")
 * @returns Translated category name (e.g., "Technologie")
 */
export function translateCategory(slug: string, locale: string): string {
  if (!slug) return '';
  const labels = CATEGORY_LABELS[locale] || CATEGORY_LABELS['en'];
  const normalized = slug.toLowerCase().trim();
  return labels[normalized] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * Safely format an article date for display.
 * 
 * Prefers ISO string (publishDate) for reliable parsing.
 * Falls back to displaying the pre-formatted date string as-is.
 * Never returns "Invalid Date".
 * 
 * @param publishDate - ISO date string from DB (e.g., "2026-03-02T12:00:00.000Z")
 * @param fallbackDate - Pre-formatted date string (e.g., "2.3.2026")
 * @param locale - Locale code (e.g., "de" or "en")
 * @param options - Intl.DateTimeFormat options (default: short month, day, year)
 * @returns Formatted date string
 */
export function formatArticleDate(
  publishDate?: string,
  fallbackDate?: string,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const localeTag = locale === 'de' ? 'de-DE' : 'en-US';
  const dateFormatOptions = options || {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  // Try parsing the ISO publishDate first (most reliable)
  if (publishDate) {
    const parsed = new Date(publishDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(localeTag, dateFormatOptions);
    }
  }

  // If fallbackDate is available, try parsing it
  if (fallbackDate) {
    const parsed = new Date(fallbackDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(localeTag, dateFormatOptions);
    }
    // If it can't be parsed, it's likely already a formatted string — return as-is
    return fallbackDate;
  }

  return '';
}

/**
 * Format a relative time string (e.g., "3h ago" / "Gerade eben").
 * Useful for news templates that show relative timestamps.
 * 
 * @param isoDate - ISO date string
 * @param locale - Locale code
 * @returns Relative time string
 */
export function formatRelativeDate(isoDate: string, locale: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return locale === 'de' ? 'Gerade eben' : 'Just now';
  }
  if (diffHours < 24) {
    return locale === 'de' ? `vor ${diffHours} Std.` : `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return locale === 'de' ? `vor ${diffDays} Tagen` : `${diffDays}d ago`;
  }
  
  return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}
