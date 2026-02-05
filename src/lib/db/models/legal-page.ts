import { ObjectId } from 'mongodb';

export type LegalPageType = 'legal' | 'disclaimer' | 'info';

export interface LegalPage {
  _id?: ObjectId;
  tenantId: string;
  slug: string;           // e.g., 'impressum', 'datenschutz', 'agb'
  title: {
    de: string;
    en: string;
  };
  content: {
    de: string;           // HTML content
    en: string;
  };
  type: LegalPageType;    // 'legal' for legal pages, 'disclaimer' for risk/footer disclaimers, 'info' for info pages
  showInFooter: boolean;  // Whether to show in footer links
  footerOrder: number;    // Order in footer (lower = first)
  isActive: boolean;      // Whether page is published
  isSystem: boolean;      // System pages can't be deleted (impressum, agb, datenschutz)
  createdAt: Date;
  updatedAt: Date;
}

export interface FooterLink {
  slug: string;
  title: {
    de: string;
    en: string;
  };
  url: string;
  order: number;
  isExternal: boolean;
}

export interface RiskDisclaimer {
  _id?: ObjectId;
  tenantId: string;
  content: {
    de: string;
    en: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Default legal page slugs (system pages)
export const SYSTEM_LEGAL_PAGES = [
  'impressum',
  'datenschutz',
  'agb',
  'widerrufsbelehrung',
  'hilfe',
  'kundenportal',
  'kuendigung',
];

// Default page titles
export const DEFAULT_PAGE_TITLES: Record<string, { de: string; en: string }> = {
  impressum: { de: 'Impressum', en: 'Legal Notice' },
  datenschutz: { de: 'Datenschutz', en: 'Privacy Policy' },
  agb: { de: 'AGB', en: 'Terms & Conditions' },
  widerrufsbelehrung: { de: 'Widerrufsbelehrung', en: 'Cancellation Policy' },
  hilfe: { de: 'Hilfe', en: 'Help' },
  kundenportal: { de: 'Kundenportal', en: 'Customer Portal' },
  kuendigung: { de: 'Kündigung', en: 'Termination' },
};
