'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useBrand } from '@/lib/brand';

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const brand = useBrand();
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { key: 'hilfe', href: brand.footer.hilfeUrl.replace('/de/', `/${locale}/`) },
    { key: 'kundenportal', href: brand.footer.kundenportalUrl.replace('/de/', `/${locale}/`) },
    { key: 'widerrufsbelehrung', href: brand.footer.widerrufsbelehrungUrl.replace('/de/', `/${locale}/`) },
    { key: 'impressum', href: brand.footer.impressumUrl.replace('/de/', `/${locale}/`) },
    { key: 'kuendigung', href: brand.footer.kuendigungUrl.replace('/de/', `/${locale}/`) },
    { key: 'agb', href: brand.footer.agbUrl.replace('/de/', `/${locale}/`) },
    { key: 'datenschutz', href: brand.footer.datenschutzUrl.replace('/de/', `/${locale}/`) },
  ];

  return (
    <footer className="border-t bg-muted/30">
      <div className="container px-4 py-8">
        {/* Footer links */}
        <nav className="flex flex-wrap justify-center gap-4 md:gap-6 mb-6">
          {footerLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t(`footer.${link.key}`)}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p className="text-center text-sm text-muted-foreground">
          {t('footer.copyright', { year: currentYear, brandName: brand.name })}
        </p>
      </div>
    </footer>
  );
}
