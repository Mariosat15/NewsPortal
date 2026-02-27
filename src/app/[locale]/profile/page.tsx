'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Smartphone, Calendar, ShoppingBag, ExternalLink, Loader2, Wifi, AlertCircle, CheckCircle } from 'lucide-react';
import { useBrand } from '../../../lib/brand/context';
import { Link } from '../../../i18n/navigation';

interface Purchase {
  id: string;
  transactionId: string;
  articleId: string;
  articleTitle: string;
  articleSlug?: string;
  articleThumbnail?: string;
  amount: number;
  currency: string;
  purchasedAt: string;
  status: string;
}

interface NetworkInfo {
  networkType: 'MOBILE_DATA' | 'WIFI' | 'UNKNOWN';
  isMobileNetwork: boolean;
  carrier?: {
    name: string;
  };
}

export default function ProfilePage() {
  const locale = useLocale();
  const router = useRouter();
  const brand = useBrand();
  
  const [msisdn, setMsisdn] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  
  // Purchases
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasesSummary, setPurchasesSummary] = useState({ totalPurchases: 0, totalSpent: 0 });
  const [loadingPurchases, setLoadingPurchases] = useState(true);

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        // Get MSISDN from cookie
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);

        const msisdnValue = cookies['user_msisdn'];
        if (msisdnValue) {
          setMsisdn(msisdnValue);
        }

        // Detect network type
        const networkResponse = await fetch('/api/network/detect');
        if (networkResponse.ok) {
          const networkData = await networkResponse.json();
          setNetworkInfo(networkData);
        }
      } catch (error) {
        console.error('Failed to initialize profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPurchases = async () => {
      try {
        const response = await fetch('/api/auth/purchases');
        const data = await response.json();
        if (response.ok) {
          setPurchases(data.data.purchases || []);
          setPurchasesSummary(data.data.summary || { totalPurchases: 0, totalSpent: 0 });
        }
      } catch (error) {
        console.error('Failed to fetch purchases:', error);
      } finally {
        setLoadingPurchases(false);
      }
    };

    initializeProfile();
    fetchPurchases();
  }, [locale, router]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount / 100);
  };

  const formatMsisdn = (msisdn: string) => {
    // Format MSISDN to be more readable (e.g., +49 123 456 789)
    if (!msisdn) return '';
    if (msisdn.length > 6) {
      return msisdn.substring(0, 3) + ' ' + msisdn.substring(3, 6) + ' ' + msisdn.substring(6);
    }
    return msisdn;
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div 
          className="h-32 md:h-40"
          style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})` }}
        />
        
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
              <Smartphone className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400" />
            </div>
            
            <div className="flex-1 sm:pb-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {locale === 'de' ? 'Mein Profil' : 'My Profile'}
              </h1>
              <p className="text-slate-600">
                {msisdn ? formatMsisdn(msisdn) : (locale === 'de' ? 'Telefonnummer wird erkannt...' : 'Detecting phone number...')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Network Status Banner */}
      {networkInfo && (
        <div 
          className="mb-6 rounded-xl p-4 flex items-center gap-3"
          style={{
            backgroundColor: networkInfo.isMobileNetwork ? '#dcfce7' : '#fef3c7',
            border: `1px solid ${networkInfo.isMobileNetwork ? '#86efac' : '#fde047'}`,
          }}
        >
          {networkInfo.isMobileNetwork ? (
            <>
              <CheckCircle 
                className="h-5 w-5 flex-shrink-0" 
                style={{ color: '#15803d' }}
              />
              <div style={{ color: '#15803d' }}>
                <p className="font-semibold">
                  {locale === 'de' ? 'Mobile Daten aktiv' : 'Mobile Data Active'}
                </p>
                <p className="text-sm opacity-90">
                  {networkInfo.carrier 
                    ? `${networkInfo.carrier.name}` 
                    : (locale === 'de' ? 'Sie können Artikel kaufen' : 'You can purchase articles')
                  }
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle 
                className="h-5 w-5 flex-shrink-0" 
                style={{ color: '#92400e' }}
              />
              <div style={{ color: '#92400e' }}>
                <p className="font-semibold">
                  {locale === 'de' ? 'WiFi erkannt' : 'WiFi Detected'}
                </p>
                <p className="text-sm opacity-90">
                  {locale === 'de' 
                    ? 'Bitte wechseln Sie zu mobilen Daten, um Artikel zu kaufen'
                    : 'Please switch to mobile data to purchase articles'
                  }
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{purchasesSummary.totalPurchases}</p>
              <p className="text-sm text-slate-600">{locale === 'de' ? 'Gekaufte Artikel' : 'Purchased Articles'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">
                {purchasesSummary.totalSpent > 0 
                  ? formatAmount(purchasesSummary.totalSpent, 'EUR')
                  : '€0.00'
                }
              </p>
              <p className="text-sm text-slate-600">{locale === 'de' ? 'Gesamt ausgegeben' : 'Total Spent'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Info */}
      {!msisdn && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <Smartphone className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                {locale === 'de' ? 'Automatische Identifikation' : 'Automatic Identification'}
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                {locale === 'de' 
                  ? 'Ihr Konto wird automatisch über Ihre Mobiltelefonnummer identifiziert. Kein Passwort erforderlich!'
                  : 'Your account is automatically identified via your mobile phone number. No password required!'
                }
              </p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>
                    {locale === 'de' 
                      ? 'Verwenden Sie mobile Daten (4G/5G) zum Kaufen'
                      : 'Use mobile data (4G/5G) to make purchases'
                    }
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>
                    {locale === 'de' 
                      ? 'Ihre Käufe werden automatisch mit Ihrer Nummer verknüpft'
                      : 'Your purchases are automatically linked to your number'
                    }
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>
                    {locale === 'de' 
                      ? 'Behalten Sie Zugriff auf alle gekauften Artikel'
                      : 'Keep access to all purchased articles'
                    }
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Purchases Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          {locale === 'de' ? 'Meine gekauften Artikel' : 'My Purchased Articles'}
        </h2>

        {loadingPurchases ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-700 mb-2">
              {locale === 'de' ? 'Noch keine Käufe' : 'No purchases yet'}
            </p>
            <p className="text-slate-500 mb-4">
              {locale === 'de' 
                ? 'Entdecken Sie unsere Artikel und kaufen Sie Ihren ersten!'
                : 'Explore our articles and buy your first one!'
              }
            </p>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-colors"
              style={{ backgroundColor: brand.primaryColor }}
            >
              {locale === 'de' ? 'Artikel durchstöbern' : 'Browse Articles'}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <div 
                key={purchase.id} 
                className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all"
              >
                {purchase.articleThumbnail && (
                  <img 
                    src={purchase.articleThumbnail} 
                    alt="" 
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">
                    {purchase.articleTitle}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span>
                      {new Date(purchase.purchasedAt).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">
                      {formatAmount(purchase.amount, purchase.currency)}
                    </span>
                  </div>
                </div>
                {purchase.articleSlug && (
                  <Link 
                    href={`/article/${purchase.articleSlug}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white text-sm transition-colors flex-shrink-0"
                    style={{ backgroundColor: brand.primaryColor }}
                  >
                    {locale === 'de' ? 'Lesen' : 'Read'}
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
