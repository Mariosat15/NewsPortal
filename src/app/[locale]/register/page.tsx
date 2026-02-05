'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Smartphone, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBrand } from '@/lib/brand/context';

export default function RegisterPage() {
  const locale = useLocale();
  const router = useRouter();
  const brand = useBrand();

  const handleGoHome = () => {
    router.push(`/${locale}`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {locale === 'de' ? 'Keine Registrierung erforderlich' : 'No Registration Required'}
          </h1>
          <p className="text-slate-600 text-lg">
            {locale === 'de' 
              ? 'Ihr Konto wird automatisch erstellt'
              : 'Your account is created automatically'
            }
          </p>
        </div>

        {/* Info Card */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Smartphone className="h-6 w-6" />
              {locale === 'de' ? 'Automatische Kontoverwaltung' : 'Automatic Account Management'}
            </CardTitle>
            <CardDescription className="text-green-700">
              {locale === 'de' 
                ? 'Ihr Konto wird beim ersten Kauf automatisch erstellt'
                : 'Your account is created automatically with your first purchase'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Benefits */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {locale === 'de' ? 'Kein Passwort' : 'No Password'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {locale === 'de' 
                      ? 'Sie müssen sich kein Passwort merken oder Formulare ausfüllen'
                      : 'No need to remember passwords or fill out forms'
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {locale === 'de' ? 'Automatische Erkennung' : 'Automatic Recognition'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {locale === 'de' 
                      ? 'Ihr Mobiltelefon identifiziert Sie automatisch beim Bezahlen'
                      : 'Your mobile phone identifies you automatically when paying'
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {locale === 'de' ? 'Sofortiger Zugriff' : 'Instant Access'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {locale === 'de' 
                      ? 'Nach dem Kauf haben Sie sofort Zugriff auf Ihre Artikel'
                      : 'After purchase, you have instant access to your articles'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <p className="font-medium text-slate-900 mb-3">
                {locale === 'de' ? 'So einfach geht\'s' : 'How It Works'}
              </p>
              <ol className="space-y-2 text-sm text-slate-700">
                <li className="flex gap-2">
                  <span className="font-semibold">1.</span>
                  <span>
                    {locale === 'de' 
                      ? 'Verwenden Sie mobile Daten (4G/5G) auf Ihrem Smartphone'
                      : 'Use mobile data (4G/5G) on your smartphone'
                    }
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">2.</span>
                  <span>
                    {locale === 'de' 
                      ? 'Lesen Sie Artikel und klicken Sie auf "Freischalten"'
                      : 'Read articles and click "Unlock"'
                    }
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">3.</span>
                  <span>
                    {locale === 'de' 
                      ? 'Bezahlen Sie über Ihre Mobilfunkrechnung'
                      : 'Pay via your mobile phone bill'
                    }
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">4.</span>
                  <span>
                    {locale === 'de' 
                      ? 'Ihr Konto wird automatisch erstellt - fertig!'
                      : 'Your account is created automatically - done!'
                    }
                  </span>
                </li>
              </ol>
            </div>

            {/* CTA */}
            <Button 
              onClick={handleGoHome}
              className="w-full h-12"
              size="lg"
            >
              {locale === 'de' ? 'Artikel durchstöbern' : 'Browse Articles'}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Help text */}
        <p className="text-center mt-6 text-sm text-slate-500">
          {locale === 'de' 
            ? 'Stellen Sie sicher, dass Sie mobile Daten verwenden, um Artikel freizuschalten.'
            : 'Make sure you are using mobile data to unlock articles.'
          }
        </p>
      </div>
    </div>
  );
}
