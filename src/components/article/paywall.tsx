'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Lock, CreditCard, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';

interface PaywallProps {
  articleId: string;
  articleSlug: string;
  priceInCents?: number;
  onUnlock?: () => void;
}

export function Paywall({
  articleId,
  articleSlug,
  priceInCents = 99,
  onUnlock,
}: PaywallProps) {
  const t = useTranslations('paywall');
  const locale = useLocale();
  const formattedPrice = formatPrice(priceInCents, locale === 'de' ? 'de-DE' : 'en-US');

  const handleUnlock = () => {
    // Redirect to DIMOCO payment
    const paymentUrl = `/api/payment/dimoco/initiate?articleId=${articleId}&slug=${articleSlug}&returnUrl=${encodeURIComponent(window.location.href)}`;
    window.location.href = paymentUrl;
  };

  return (
    <div className="relative">
      {/* Blur overlay for content preview */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
      
      {/* Paywall card */}
      <Card className="relative mx-auto max-w-md border-primary/20 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">{t('title')}</CardTitle>
          <CardDescription>{t('description', { price: formattedPrice })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-green-500" />
              <span>{t('paymentSecure')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CreditCard className="h-4 w-4 text-blue-500" />
              <span>{t('oneTimePayment')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>{t('instantAccess')}</span>
            </div>
          </div>

          {/* Unlock button */}
          <Button
            onClick={handleUnlock}
            className="w-full text-lg h-12"
            size="lg"
          >
            {t('unlockFor', { price: formattedPrice })}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
