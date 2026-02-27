'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Lock, CreditCard, Shield, Zap, Wifi, WifiOff, Smartphone, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { storeDeviceInfo } from '@/lib/utils/device-fingerprint';

interface PaywallProps {
  articleId: string;
  articleSlug: string;
  priceInCents?: number;
  onUnlock?: () => void;
}

interface NetworkDetectionResult {
  networkType: 'MOBILE_DATA' | 'WIFI' | 'UNKNOWN';
  isMobileNetwork: boolean;
  carrier?: {
    name: string;
    code: string;
    country: string;
  };
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
  const [networkInfo, setNetworkInfo] = useState<NetworkDetectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Detect network type on component mount
  useEffect(() => {
    async function detectNetwork() {
      try {
        const response = await fetch('/api/network/detect');
        if (response.ok) {
          const data = await response.json();
          setNetworkInfo(data);
        }
      } catch (error) {
        console.error('Network detection failed:', error);
        // Default to unknown
        setNetworkInfo({
          networkType: 'UNKNOWN',
          isMobileNetwork: false,
        });
      } finally {
        setLoading(false);
      }
    }
    detectNetwork();
  }, []);

  // Check for restore error/success in URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const restoreErr = params.get('restore_error');
    const restored = params.get('restored');

    if (restored === 'true') {
      // Access was restored - reload the page to re-check unlock status
      window.location.href = window.location.pathname;
      return;
    }

    if (restoreErr === 'no_purchases') {
      setRestoreError(
        locale === 'de'
          ? 'Keine Käufe für Ihre Nummer gefunden. Bitte kaufen Sie den Artikel zuerst.'
          : 'No purchases found for your number. Please purchase the article first.'
      );
    } else if (restoreErr === 'not_found') {
      setRestoreError(
        locale === 'de'
          ? 'Zugang konnte nicht wiederhergestellt werden. Bitte stellen Sie sicher, dass Sie mobile Daten verwenden.'
          : 'Could not restore access. Please make sure you are using mobile data.'
      );
    }
  }, [locale]);

  const handleUnlock = () => {
    // Block if on WiFi
    if (networkInfo && !networkInfo.isMobileNetwork) {
      return; // Shouldn't happen as button is disabled, but safety check
    }
    
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
    }));
    
    // Redirect to DIMOCO payment with device data
    const paymentUrl = `/api/payment/dimoco/initiate?articleId=${articleId}&slug=${articleSlug}&returnUrl=${encodeURIComponent(window.location.href)}&deviceData=${deviceData}`;
    window.location.href = paymentUrl;
  };

  const handleRestoreAccess = () => {
    setRestoring(true);
    setRestoreError(null);
    // Redirect to the restore access endpoint
    const restoreUrl = `/api/auth/restore-access?slug=${articleSlug}&returnUrl=${encodeURIComponent(window.location.pathname)}`;
    window.location.href = restoreUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isOnWifi = networkInfo && !networkInfo.isMobileNetwork;
  const isOnMobile = networkInfo && networkInfo.isMobileNetwork;

  return (
    <div className="relative">
      {/* Blur overlay for content preview */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
      
      {/* Paywall card */}
      <Card className={`relative mx-auto max-w-md shadow-lg ${
        isOnWifi ? 'border-amber-300 bg-amber-50/50' : 'border-primary/20'
      }`}>
        <CardHeader className="text-center pb-2">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
            isOnWifi ? 'bg-amber-100' : 'bg-primary/10'
          }`}>
            {isOnWifi ? (
              <WifiOff className="h-6 w-6 text-amber-600" />
            ) : (
              <Lock className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle className="text-xl">
            {isOnWifi 
              ? (locale === 'de' ? 'Mobilfunknetz erforderlich' : 'Mobile Data Required')
              : t('title')
            }
          </CardTitle>
          <CardDescription>
            {isOnWifi
              ? (locale === 'de' 
                  ? 'Zum Freischalten dieses Artikels benötigen Sie eine mobile Datenverbindung'
                  : 'To unlock this article, you need a mobile data connection'
                )
              : t('description', { price: formattedPrice })
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOnWifi ? (
            // WiFi User - show instructions
            <div className="space-y-4">
              <div className="p-4 bg-amber-100 border border-amber-300 rounded-lg">
                <p className="font-medium text-amber-900 mb-3">
                  {locale === 'de' ? 'So schalten Sie den Artikel frei:' : 'How to unlock this article:'}
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-amber-800">
                  <li>{locale === 'de' ? 'WLAN auf Ihrem Gerät deaktivieren' : 'Turn off WiFi on your device'}</li>
                  <li>{locale === 'de' ? 'Mobile Daten (4G/5G) aktivieren' : 'Enable mobile data (4G/5G)'}</li>
                  <li>{locale === 'de' ? 'Diese Seite erneut aufrufen' : 'Return to this page'}</li>
                  <li>{locale === 'de' ? 'Artikel freischalten' : 'Unlock the article'}</li>
                </ol>
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <Smartphone className="h-4 w-4" />
                <span>
                  {locale === 'de' 
                    ? 'Die Zahlung erfolgt über Ihre Mobilfunkrechnung'
                    : 'Payment is charged to your mobile phone bill'
                  }
                </span>
              </div>
            </div>
          ) : (
            // Mobile Data User - show unlock button
            <>
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

              {/* Carrier info if available */}
              {networkInfo?.carrier && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                  <Smartphone className="h-4 w-4" />
                  <span>
                    {locale === 'de' ? 'Verbunden mit' : 'Connected to'} <strong>{networkInfo.carrier.name}</strong>
                  </span>
                </div>
              )}

              {/* Unlock button */}
              <Button
                onClick={handleUnlock}
                className="w-full text-lg h-12"
                size="lg"
              >
                {t('unlockFor', { price: formattedPrice })}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {locale === 'de' 
                  ? 'Wird Ihrer Mobilfunkrechnung belastet'
                  : 'Charged to your mobile phone bill'
                }
              </p>
            </>
          )}

          {/* Restore Access - shown for both WiFi and mobile users */}
          <div className="pt-3 border-t">
            {restoreError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {restoreError}
              </div>
            )}
            <button
              onClick={handleRestoreAccess}
              disabled={restoring}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              {restoring ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              <span>
                {restoring
                  ? (locale === 'de' ? 'Zugang wird wiederhergestellt...' : 'Restoring access...')
                  : (locale === 'de' ? 'Bereits gekauft? Zugang wiederherstellen' : 'Already purchased? Restore access')
                }
              </span>
            </button>
            <p className="text-xs text-center text-muted-foreground mt-1">
              {locale === 'de'
                ? 'Nutzen Sie dies, wenn Sie den Artikel in einem anderen Browser gekauft haben'
                : 'Use this if you purchased the article in a different browser'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
