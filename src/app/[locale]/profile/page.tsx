'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { User, Mail, Calendar, Shield, LogOut, Loader2, Settings, Bookmark, Heart, Edit, Save, X, Eye, Lock, ShoppingBag, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBrand } from '@/lib/brand/context';
import type { SafeUser } from '@/lib/db/models/user';
import { Link } from '@/i18n/navigation';

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

export default function ProfilePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const brand = useBrand();
  
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Edit mode states
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  // Purchases
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasesSummary, setPurchasesSummary] = useState({ totalPurchases: 0, totalSpent: 0 });
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'purchases' | 'security'>('profile');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (!response.ok) {
          router.push(`/${locale}/login`);
          return;
        }

        setUser(data.user);
        setEditName(data.user.name || '');
      } catch (error) {
        console.error('Failed to fetch user:', error);
        router.push(`/${locale}/login`);
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

    fetchUser();
    fetchPurchases();
  }, [locale, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push(`/${locale}`);
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        setSaveError(data.error || 'Failed to save');
        return;
      }
      
      setUser(data.user);
      setEditMode(false);
    } catch (error) {
      setSaveError('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError(locale === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(locale === 'de' ? 'Passwort muss mindestens 8 Zeichen haben' : 'Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        setPasswordError(data.error || 'Failed to change password');
        return;
      }
      
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (error) {
      setPasswordError('Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div 
          className="h-32 md:h-40"
          style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})` }}
        />
        
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <span className="text-4xl sm:text-5xl font-bold text-slate-400">
                  {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            <div className="flex-1 sm:pb-2">
              <h1 className="text-2xl font-bold text-slate-900">{user.name || 'User'}</h1>
              <p className="text-slate-600">{user.email}</p>
            </div>
            
            <div className="flex gap-2 sm:pb-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                {t('auth.logout')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Bookmark className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">0</p>
              <p className="text-sm text-slate-600">{t('nav.bookmarks')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Heart className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">0</p>
              <p className="text-sm text-slate-600">{locale === 'de' ? 'Favoriten' : 'Favorites'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{purchasesSummary.totalPurchases}</p>
              <p className="text-sm text-slate-600">{locale === 'de' ? 'Gekauft' : 'Purchased'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {new Date(user.createdAt).toLocaleDateString(locale, { month: 'short', year: 'numeric' })}
              </p>
              <p className="text-sm text-slate-600">{locale === 'de' ? 'Dabei seit' : 'Joined'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {[
          { id: 'profile', label: locale === 'de' ? 'Profil' : 'Profile', icon: User },
          { id: 'purchases', label: locale === 'de' ? 'Käufe' : 'Purchases', icon: ShoppingBag },
          { id: 'security', label: locale === 'de' ? 'Sicherheit' : 'Security', icon: Lock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              {locale === 'de' ? 'Kontoinformationen' : 'Account Information'}
            </h2>
            {!editMode ? (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                <Edit className="h-4 w-4 mr-2" />
                {locale === 'de' ? 'Bearbeiten' : 'Edit'}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEditMode(false); setEditName(user.name || ''); }}>
                  <X className="h-4 w-4 mr-2" />
                  {locale === 'de' ? 'Abbrechen' : 'Cancel'}
                </Button>
                <Button size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {locale === 'de' ? 'Speichern' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          {saveError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {saveError}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <User className="h-5 w-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-500 uppercase tracking-wide">{t('auth.name')}</p>
                {editMode ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1"
                    placeholder={locale === 'de' ? 'Ihr Name' : 'Your name'}
                  />
                ) : (
                  <p className="text-slate-900 font-medium">{user.name || '-'}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <Mail className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{t('auth.email')}</p>
                <p className="text-slate-900 font-medium">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <Shield className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  {locale === 'de' ? 'Konto-Status' : 'Account Status'}
                </p>
                <p className="text-green-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {locale === 'de' ? 'Aktiv' : 'Active'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchases Tab */}
      {activeTab === 'purchases' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              {locale === 'de' ? 'Meine Käufe' : 'My Purchases'}
            </h2>
            {purchasesSummary.totalSpent > 0 && (
              <div className="text-right">
                <p className="text-sm text-slate-500">{locale === 'de' ? 'Gesamt ausgegeben' : 'Total spent'}</p>
                <p className="text-xl font-bold text-slate-900">{formatAmount(purchasesSummary.totalSpent, 'EUR')}</p>
              </div>
            )}
          </div>

          {loadingPurchases ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">{locale === 'de' ? 'Noch keine Käufe' : 'No purchases yet'}</p>
              <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
                {locale === 'de' ? 'Artikel entdecken' : 'Discover articles'}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  {purchase.articleThumbnail && (
                    <img 
                      src={purchase.articleThumbnail} 
                      alt="" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{purchase.articleTitle}</h3>
                    <p className="text-sm text-slate-500">
                      {new Date(purchase.purchasedAt).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatAmount(purchase.amount, purchase.currency)}</p>
                    {purchase.articleSlug && (
                      <Link 
                        href={`/article/${purchase.articleSlug}`}
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 justify-end"
                      >
                        {locale === 'de' ? 'Lesen' : 'Read'}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            {locale === 'de' ? 'Passwort ändern' : 'Change Password'}
          </h2>

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {locale === 'de' ? 'Passwort erfolgreich geändert!' : 'Password changed successfully!'}
            </div>
          )}

          {passwordError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {passwordError}
            </div>
          )}

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {locale === 'de' ? 'Aktuelles Passwort' : 'Current Password'}
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {locale === 'de' ? 'Neues Passwort' : 'New Password'}
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              <p className="text-xs text-slate-500 mt-1">
                {locale === 'de' ? 'Mindestens 8 Zeichen' : 'Minimum 8 characters'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {locale === 'de' ? 'Passwort bestätigen' : 'Confirm Password'}
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button 
              onClick={handleChangePassword} 
              disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
              className="w-full sm:w-auto"
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
              {locale === 'de' ? 'Passwort ändern' : 'Change Password'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
