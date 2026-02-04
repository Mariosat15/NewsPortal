'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Lock, CreditCard, Shield, Zap, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { collectDeviceInfo, storeDeviceInfo } from '@/lib/utils/device-fingerprint';

interface PaywallProps {
  articleId: string;
  articleSlug: string;
  priceInCents?: number;
  onUnlock?: () => void;
}

interface UserSession {
  id: string;
  email: string;
  name?: string;
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
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingUnlock, setCheckingUnlock] = useState(false);

  // Check if user is logged in and if they already have access
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            
            // Check if user already has this article unlocked
            setCheckingUnlock(true);
            const purchasesRes = await fetch('/api/auth/purchases');
            if (purchasesRes.ok) {
              const purchasesData = await purchasesRes.json();
              const hasAccess = purchasesData.purchases?.some(
                (p: { articleId: string }) => p.articleId === articleId
              );
              if (hasAccess) {
                // User already has access, trigger unlock
                onUnlock?.();
              }
            }
            setCheckingUnlock(false);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [articleId, onUnlock]);

  const handleUnlock = () => {
    // Collect device fingerprint before payment
    const deviceInfo = storeDeviceInfo();
    console.log('[Payment] Device fingerprint collected:', deviceInfo.deviceFingerprint);
    
    // Encode device info for URL (will be passed through payment flow)
    const deviceData = encodeURIComponent(JSON.stringify({
      fp: deviceInfo.deviceFingerprint,
      browser: deviceInfo.browser,
      browserVersion: deviceInfo.browserVersion,
      os: deviceInfo.os,
      osVersion: deviceInfo.osVersion,
      screen: deviceInfo.screenResolution,
      tz: deviceInfo.timezone,
      lang: deviceInfo.language,
      gpu: deviceInfo.gpu,
      // Include user ID and email if logged in (for linking purchase to account)
      userId: user?.id,
      userEmail: user?.email,
    }));
    
    // Redirect to DIMOCO payment with device data
    const paymentUrl = `/api/payment/dimoco/initiate?articleId=${articleId}&slug=${articleSlug}&returnUrl=${encodeURIComponent(window.location.href)}&deviceData=${deviceData}`;
    window.location.href = paymentUrl;
  };

  const handleLogin = () => {
    // Redirect to login page with return URL
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `/${locale}/login?returnUrl=${returnUrl}`;
  };

  const handleRegister = () => {
    // Redirect to register page with return URL
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `/${locale}/register?returnUrl=${returnUrl}`;
  };

  if (loading || checkingUnlock) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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

          {/* Show different UI based on login state */}
          {user ? (
            // User is logged in - show unlock button
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                <User className="h-4 w-4" />
                <span>{locale === 'de' ? 'Angemeldet als' : 'Logged in as'} <strong>{user.email}</strong></span>
              </div>
              <Button
                onClick={handleUnlock}
                className="w-full text-lg h-12"
                size="lg"
              >
                {t('unlockFor', { price: formattedPrice })}
              </Button>
            </div>
          ) : (
            // User is not logged in - show login/register options
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <p className="font-medium mb-1">
                  {locale === 'de' ? 'Anmeldung erforderlich' : 'Login required'}
                </p>
                <p className="text-xs">
                  {locale === 'de' 
                    ? 'Bitte melden Sie sich an oder registrieren Sie sich, um diesen Artikel freizuschalten. So können Sie jederzeit auf Ihre gekauften Artikel zugreifen.'
                    : 'Please log in or register to unlock this article. This way you can always access your purchased articles.'
                  }
                </p>
              </div>
              
              <Button
                onClick={handleLogin}
                className="w-full h-11"
                size="lg"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {locale === 'de' ? 'Anmelden' : 'Log in'}
              </Button>
              
              <Button
                onClick={handleRegister}
                variant="outline"
                className="w-full h-11"
                size="lg"
              >
                <User className="h-4 w-4 mr-2" />
                {locale === 'de' ? 'Neu registrieren' : 'Create account'}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                {locale === 'de' 
                  ? 'Nach der Anmeldung können Sie den Artikel für ' + formattedPrice + ' freischalten'
                  : 'After logging in, you can unlock the article for ' + formattedPrice
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
