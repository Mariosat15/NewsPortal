'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Smartphone, ArrowRight, Info } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useBrand } from '../../../lib/brand/context';

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const brand = useBrand();

  const handleGoHome = () => {
    router.push(`/${locale}`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: brand.primaryColor }}
          >
            {brand.name.charAt(0)}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {locale === 'de' ? 'Anmeldung nicht mehr erforderlich' : 'Login No Longer Required'}
          </h1>
          <p className="text-slate-600 text-lg">
            {locale === 'de' 
              ? 'Wir haben zu mobilem Bezahlen gewechselt'
              : 'We have switched to mobile carrier billing'
            }
          </p>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Smartphone className="h-6 w-6" />
              {locale === 'de' ? 'So funktioniert es jetzt' : 'How It Works Now'}
            </CardTitle>
            <CardDescription className="text-blue-700">
              {locale === 'de' 
                ? 'Einfacher und schneller Zugriff auf Premium-Inhalte'
                : 'Easier and faster access to premium content'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Steps */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {locale === 'de' ? 'Mobile Daten verwenden' : 'Use Mobile Data'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {locale === 'de' 
                      ? 'Besuchen Sie unsere Seite über Ihr mobiles Datennetz (4G/5G), nicht über WLAN'
                      : 'Visit our site using your mobile data network (4G/5G), not WiFi'
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {locale === 'de' ? 'Artikel lesen und freischalten' : 'Read and Unlock Articles'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {locale === 'de' 
                      ? 'Stöbern Sie frei und schalten Sie Premium-Artikel mit einem Klick frei'
                      : 'Browse freely and unlock premium articles with one click'
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {locale === 'de' ? 'Automatischer Zugriff' : 'Automatic Access'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {locale === 'de' 
                      ? 'Ihre gekauften Artikel bleiben automatisch freigeschaltet wenn Sie zurückkehren'
                      : 'Your purchased articles stay unlocked automatically when you return'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="flex items-start gap-2 mb-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">
                    {locale === 'de' ? 'Ihre Vorteile' : 'Your Benefits'}
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-slate-700 ml-7">
                <li>{locale === 'de' ? 'Keine Registrierung erforderlich' : 'No registration required'}</li>
                <li>{locale === 'de' ? 'Keine Passwörter zu merken' : 'No passwords to remember'}</li>
                <li>{locale === 'de' ? 'Zahlung über Mobilfunkrechnung' : 'Payment via mobile phone bill'}</li>
                <li>{locale === 'de' ? 'Automatische Wiedererkennung auf Ihrem Gerät' : 'Automatic recognition on your device'}</li>
              </ul>
            </div>

            {/* CTA */}
            <Button 
              onClick={handleGoHome}
              className="w-full h-12"
              size="lg"
            >
              {locale === 'de' ? 'Zur Startseite' : 'Go to Homepage'}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Help text */}
        <p className="text-center mt-6 text-sm text-slate-500">
          {locale === 'de' 
            ? 'Benötigen Sie Hilfe? Besuchen Sie unsere FAQ oder kontaktieren Sie den Support.'
            : 'Need help? Visit our FAQ or contact support.'
          }
        </p>
      </div>
    </div>
  );
}
