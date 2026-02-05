'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ResolvedTemplate, CategoryConfig } from '@/lib/templates/types';

interface FooterLegalPage {
  _id: string;
  slug: string;
  title: { de: string; en: string };
}

interface RiskDisclaimer {
  content: { de: string; en: string };
  isActive: boolean;
}

interface TemplateFooterProps {
  template: ResolvedTemplate;
  categories: CategoryConfig[];
  locale: string;
  brandName: string;
}

export function TemplateFooter({ template, categories, locale, brandName }: TemplateFooterProps) {
  const colors = template.activeColors;
  const currentYear = new Date().getFullYear();

  const [footerLinks, setFooterLinks] = useState<FooterLegalPage[]>([]);
  const [disclaimer, setDisclaimer] = useState<RiskDisclaimer | null>(null);

  // Fetch dynamic footer data
  useEffect(() => {
    async function fetchFooterData() {
      try {
        const res = await fetch('/api/legal-pages');
        const data = await res.json();
        if (data.success) {
          setFooterLinks(data.data.footerLinks || []);
          setDisclaimer(data.data.disclaimer);
        }
      } catch (error) {
        console.error('Failed to fetch footer data:', error);
      }
    }
    fetchFooterData();
  }, []);

  // Default links if no dynamic ones loaded
  const defaultLinks = [
    { slug: 'hilfe', title: { de: 'Hilfe', en: 'Help' } },
    { slug: 'impressum', title: { de: 'Impressum', en: 'Legal Notice' } },
    { slug: 'agb', title: { de: 'AGB', en: 'Terms' } },
    { slug: 'datenschutz', title: { de: 'Datenschutz', en: 'Privacy' } },
  ];

  const links = footerLinks.length > 0 ? footerLinks : defaultLinks;
  const enabledCategories = categories.filter(c => c.enabled).slice(0, 6);

  return (
    <footer 
      style={{ 
        backgroundColor: colors.surface,
        borderTop: `1px solid ${colors.border}`,
        color: colors.textMuted,
      }}
    >
      {/* Main Footer */}
      <div 
        className="mx-auto px-4 py-12"
        style={{ maxWidth: template.spacing.containerMax }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 
              className="text-lg font-bold mb-4"
              style={{ color: colors.text, fontFamily: template.typography.headingFont }}
            >
              {brandName}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
              {locale === 'de' 
                ? 'Aktuelle Nachrichten und Analysen aus aller Welt.'
                : 'Current news and analysis from around the world.'}
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: colors.textMuted }}
            >
              {locale === 'de' ? 'Kategorien' : 'Categories'}
            </h4>
            <ul className="space-y-2">
              {enabledCategories.slice(0, 4).map((cat) => (
                <li key={cat.slug}>
                  <Link 
                    href={`/${locale}/categories/${cat.slug}`}
                    className="text-sm transition-colors hover:opacity-80"
                    style={{ color: colors.textMuted }}
                  >
                    {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: colors.textMuted }}
            >
              {locale === 'de' ? 'Links' : 'Links'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href={`/${locale}`} 
                  className="text-sm transition-colors hover:opacity-80"
                  style={{ color: colors.textMuted }}
                >
                  {locale === 'de' ? 'Startseite' : 'Home'}
                </Link>
              </li>
              {enabledCategories.slice(4, 6).map((cat) => (
                <li key={cat.slug}>
                  <Link 
                    href={`/${locale}/categories/${cat.slug}`}
                    className="text-sm transition-colors hover:opacity-80"
                    style={{ color: colors.textMuted }}
                  >
                    {cat.displayName?.[locale as 'de' | 'en'] || cat.displayName?.de || cat.slug}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: colors.textMuted }}
            >
              {locale === 'de' ? 'Rechtliches' : 'Legal'}
            </h4>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.slug}>
                  <Link 
                    href={`/${locale}/legal/${link.slug}`}
                    className="text-sm transition-colors hover:opacity-80"
                    style={{ color: colors.textMuted }}
                  >
                    {link.title?.[locale as 'de' | 'en'] || link.title?.de || link.slug}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Risk Disclaimer */}
      {disclaimer?.isActive && disclaimer.content?.[locale as 'de' | 'en'] && (
        <div style={{ borderTop: `1px solid ${colors.border}` }}>
          <div 
            className="mx-auto px-4 py-4"
            style={{ maxWidth: template.spacing.containerMax }}
          >
            <div 
              className="text-center text-xs max-w-3xl mx-auto prose prose-sm"
              style={{ color: colors.textMuted }}
              dangerouslySetInnerHTML={{ __html: disclaimer.content[locale as 'de' | 'en'] }}
            />
          </div>
        </div>
      )}

      {/* Bottom Copyright */}
      <div style={{ borderTop: `1px solid ${colors.border}` }}>
        <div 
          className="mx-auto px-4 py-4"
          style={{ maxWidth: template.spacing.containerMax }}
        >
          <p 
            className="text-center text-xs"
            style={{ color: colors.textMuted, opacity: 0.7 }}
          >
            © {currentYear} {brandName}. {locale === 'de' ? 'Alle Rechte vorbehalten.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
