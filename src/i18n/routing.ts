import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['de', 'en'],

  // Used when no locale matches
  defaultLocale: 'de',

  // The locale prefix strategy
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
