'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useBrand } from '@/lib/brand/context';
import { sanitizeHtml } from '@/lib/utils/sanitize-html';
import { useState, useEffect } from 'react';

interface FooterLegalPage {
  _id: string;
  slug: string;
  title: { de: string; en: string };
}

interface RiskDisclaimer {
  content: { de: string; en: string };
  isActive: boolean;
}

export function Footer() {
  const t = useTranslations();
  const locale = useLocale() as 'de' | 'en';
  const brand = useBrand();
  const currentYear = new Date().getFullYear();

  const [dynamicLinks, setDynamicLinks] = useState<FooterLegalPage[]>([]);
  const [disclaimer, setDisclaimer] = useState<RiskDisclaimer | null>(null);

  // Fetch dynamic footer data
  useEffect(() => {
    async function fetchFooterData() {
      try {
        const res = await fetch('/api/legal-pages');
        const data = await res.json();
        if (data.success) {
          setDynamicLinks(data.data.footerLinks || []);
          setDisclaimer(data.data.disclaimer);
        }
      } catch (error) {
        console.error('Failed to fetch footer data:', error);
      }
    }
    fetchFooterData();
  }, []);

  // Fallback to static links if no dynamic ones loaded
  const footerLinks = dynamicLinks.length > 0
    ? dynamicLinks.map(page => ({
        key: page.slug,
        label: page.title?.[locale] || page.title?.de || page.slug,
        href: `/${locale}/legal/${page.slug}`,
      }))
    : [
        { key: 'hilfe', label: t('footer.hilfe'), href: brand.footer.hilfeUrl.replace('/de/', `/${locale}/`) },
        { key: 'impressum', label: t('footer.impressum'), href: brand.footer.impressumUrl.replace('/de/', `/${locale}/`) },
        { key: 'agb', label: t('footer.agb'), href: brand.footer.agbUrl.replace('/de/', `/${locale}/`) },
        { key: 'datenschutz', label: t('footer.datenschutz'), href: brand.footer.datenschutzUrl.replace('/de/', `/${locale}/`) },
      ];

  const categories = [
    { key: 'news', label: locale === 'de' ? 'Nachrichten' : 'News' },
    { key: 'technology', label: locale === 'de' ? 'Technologie' : 'Tech' },
    { key: 'entertainment', label: locale === 'de' ? 'Unterhaltung' : 'Entertainment' },
    { key: 'sports', label: locale === 'de' ? 'Sport' : 'Sports' },
    { key: 'health', label: locale === 'de' ? 'Gesundheit' : 'Health' },
    { key: 'finance', label: locale === 'de' ? 'Finanzen' : 'Business' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg font-bold text-white mb-4">{brand.name}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {locale === 'de' 
                ? 'Aktuelle Nachrichten und Analysen aus aller Welt.'
                : 'Current news and analysis from around the world.'}
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
              {locale === 'de' ? 'Kategorien' : 'Categories'}
            </h4>
            <ul className="space-y-2">
              {categories.slice(0, 4).map((cat) => (
                <li key={cat.key}>
                  <Link 
                    href={`/${locale}/categories/${cat.key}`}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
              {locale === 'de' ? 'Links' : 'Links'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                  {locale === 'de' ? 'Startseite' : 'Home'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/login`} className="text-sm text-gray-400 hover:text-white transition-colors">
                  {locale === 'de' ? 'Anmelden' : 'Login'}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/register`} className="text-sm text-gray-400 hover:text-white transition-colors">
                  {locale === 'de' ? 'Registrieren' : 'Register'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
              {locale === 'de' ? 'Rechtliches' : 'Legal'}
            </h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Risk Disclaimer */}
      {disclaimer?.isActive && disclaimer.content?.[locale] && (
        <div className="border-t border-gray-800">
          <div className="container mx-auto px-4 py-4">
            <div 
              className="text-center text-xs text-gray-500 max-w-3xl mx-auto"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(disclaimer.content[locale]) }}
            />
          </div>
        </div>
      )}

      {/* Bottom */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-xs text-gray-500">
            © {currentYear} {brand.name}. {locale === 'de' ? 'Alle Rechte vorbehalten.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
