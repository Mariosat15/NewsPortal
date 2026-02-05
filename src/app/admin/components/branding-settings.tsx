'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Globe, 
  Image, 
  Type, 
  Save, 
  RotateCcw,
  Building,
  Mail,
  Phone,
  FileText,
  Link as LinkIcon,
  AlertCircle,
  Database,
  Loader2,
  CheckCircle,
  Key,
  CreditCard,
  Bot,
  Eye,
  EyeOff,
  DollarSign,
  Power,
  Upload
} from 'lucide-react';

interface BrandSettings {
  id: string;
  name: string;
  domain: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  impressum: {
    companyName: string;
    address: string;
    email: string;
    phone: string;
    vatId: string;
    registerNumber: string;
  };
  footer: {
    hilfeUrl: string;
    kundenportalUrl: string;
    widerrufsbelehrungUrl: string;
    impressumUrl: string;
    kuendigungUrl: string;
    agbUrl: string;
    datenschutzUrl: string;
  };
  features: {
    bookmarks: boolean;
    favorites: boolean;
    trending: boolean;
  };
  pricing: {
    enabled: boolean;
    articlePriceCents: number;
    currency: string;
  };
  dimoco: {
    apiUrl: string;
    merchantId: string;
    password: string;
    orderId: string;
    useMock: boolean;
  };
  openai: {
    apiKey: string;
  };
  brightdata: {
    apiToken: string;
    zone: string;
  };
  admin: {
    email: string;
    password: string;
  };
  database: {
    uri: string;
  };
  agentConfig: {
    cronSchedule: string;
    maxArticlesPerRun: number;
    defaultTopics: string[];
    defaultLanguage: string;
  };
}

const defaultSettings: BrandSettings = {
  id: 'brand1',
  name: 'News Portal',
  domain: 'localhost:3000',
  logoUrl: '/images/logo.png',
  faviconUrl: '/favicon.svg',
  primaryColor: '#1a73e8',
  secondaryColor: '#4285f4',
  impressum: {
    companyName: 'News Portal GmbH',
    address: 'Musterstraße 1, 10115 Berlin, Germany',
    email: 'kontakt@newsportal.de',
    phone: '+49 30 12345678',
    vatId: '',
    registerNumber: '',
  },
  footer: {
    hilfeUrl: '/legal/hilfe',
    kundenportalUrl: '/legal/kundenportal',
    widerrufsbelehrungUrl: '/legal/widerrufsbelehrung',
    impressumUrl: '/legal/impressum',
    kuendigungUrl: '/legal/kuendigung',
    agbUrl: '/legal/agb',
    datenschutzUrl: '/legal/datenschutz',
  },
  features: {
    bookmarks: true,
    favorites: true,
    trending: true,
  },
  pricing: {
    enabled: true,
    articlePriceCents: 99,
    currency: 'EUR',
  },
  dimoco: {
    apiUrl: 'https://sandbox-dcb.dimoco.at/sph/payment',
    merchantId: '8000',
    password: '',
    orderId: '8000',
    useMock: false,
  },
  openai: {
    apiKey: '',
  },
  brightdata: {
    apiToken: '',
    zone: 'web_unlocker1',
  },
  admin: {
    email: 'admin@example.com',
    password: '',
  },
  database: {
    uri: '',
  },
  agentConfig: {
    cronSchedule: '0 */6 * * *',
    maxArticlesPerRun: 5,
    defaultTopics: ['news', 'lifestyle', 'technology', 'sports', 'health', 'finance'],
    defaultLanguage: 'de',
  },
};

export function BrandingSettings() {
  const [settings, setSettings] = useState<BrandSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'general' | 'legal' | 'features' | 'pricing' | 'api' | 'system'>('general');
  const [initializingDb, setInitializingDb] = useState(false);
  const [dbInitResult, setDbInitResult] = useState<{ created: string[]; errors: string[] } | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [resettingDb, setResettingDb] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [resetResult, setResetResult] = useState<{ deleted: string[]; errors: string[]; preserved: string[] } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          // Deep merge with defaults
          const merged = {
            ...defaultSettings,
            ...data.settings,
            impressum: { ...defaultSettings.impressum, ...(data.settings.impressum || {}) },
            footer: { ...defaultSettings.footer, ...(data.settings.footer || {}) },
            features: { ...defaultSettings.features, ...(data.settings.features || {}) },
            pricing: { ...defaultSettings.pricing, ...(data.settings.pricing || {}) },
            dimoco: { ...defaultSettings.dimoco, ...(data.settings.dimoco || {}) },
            openai: { ...defaultSettings.openai, ...(data.settings.openai || {}) },
            brightdata: { ...defaultSettings.brightdata, ...(data.settings.brightdata || {}) },
            admin: { ...defaultSettings.admin, ...(data.settings.admin || {}) },
            database: { ...defaultSettings.database, ...(data.settings.database || {}) },
            agentConfig: { ...defaultSettings.agentConfig, ...(data.settings.agentConfig || {}) },
          };
          setSettings(merged);
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setError('Failed to save settings: ' + (err instanceof Error ? err.message : 'Network error'));
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings(defaultSettings);
    }
  }

  function updateSetting<K extends keyof BrandSettings>(key: K, value: BrandSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  function updateNestedSetting<K extends keyof BrandSettings>(
    parentKey: K, 
    childKey: string, 
    value: string | boolean | number | string[]
  ) {
    setSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] as object),
        [childKey]: value,
      },
    }));
  }

  function toggleApiKeyVisibility(key: string) {
    setShowApiKeys(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleInitializeDatabase() {
    setInitializingDb(true);
    setDbInitResult(null);
    try {
      const response = await fetch('/api/admin/database/init', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        setDbInitResult(data.data);
      } else {
        setError(data.error || 'Failed to initialize database');
      }
    } catch (err) {
      setError('Failed to initialize database');
    } finally {
      setInitializingDb(false);
    }
  }

  async function handleResetDatabase() {
    if (resetConfirmation !== 'RESET_DATABASE') {
      setError('Please type "RESET_DATABASE" to confirm');
      return;
    }

    if (!confirm('⚠️ FINAL WARNING: This will permanently delete ALL users, articles, transactions, and other data. Settings will be preserved. This cannot be undone! Are you absolutely sure?')) {
      return;
    }

    setResettingDb(true);
    setResetResult(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/database/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: resetConfirmation }),
      });
      const data = await response.json();
      if (response.ok) {
        setResetResult(data.results);
        setResetConfirmation('');
      } else {
        setError(data.error || 'Failed to reset database');
      }
    } catch (err) {
      setError('Failed to reset database');
    } finally {
      setResettingDb(false);
    }
  }

  const sections = [
    { id: 'general', label: 'General', icon: Palette },
    { id: 'legal', label: 'Legal & Company', icon: Building },
    { id: 'features', label: 'Features', icon: FileText },
    { id: 'pricing', label: 'Pricing & Payment', icon: CreditCard },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'system', label: 'System', icon: Database },
  ] as const;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your portal settings and API credentials</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {saved && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="h-5 w-5" />
          Settings saved successfully!
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
              activeSection === section.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <section.icon className="h-4 w-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeSection === 'general' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Brand Identity
              </CardTitle>
              <CardDescription>Configure your portal's name and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandId">Brand ID</Label>
                <Input id="brandId" value={settings.id} disabled className="bg-gray-50" />
                <p className="text-xs text-muted-foreground">Read-only identifier</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandName">Portal Name</Label>
                <Input 
                  id="brandName" 
                  value={settings.name} 
                  onChange={(e) => updateSetting('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input 
                  id="domain" 
                  value={settings.domain} 
                  onChange={(e) => updateSetting('domain', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Logo & Assets
              </CardTitle>
              <CardDescription>Upload your brand assets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-3">
                <Label>Logo</Label>
                <p className="text-xs text-muted-foreground">PNG or JPEG only, max 5MB</p>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input 
                      id="logoUrl" 
                      value={settings.logoUrl} 
                      onChange={(e) => updateSetting('logoUrl', e.target.value)}
                      placeholder="/images/logo.png or upload"
                    />
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Client-side validation
                        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
                        if (!allowedTypes.includes(file.type)) {
                          alert('Invalid file type. Only PNG and JPEG images are allowed.');
                          e.target.value = '';
                          return;
                        }
                        
                        const maxSize = 5 * 1024 * 1024; // 5MB
                        if (file.size > maxSize) {
                          alert('File too large. Maximum size is 5MB.');
                          e.target.value = '';
                          return;
                        }
                        
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('type', 'logo');
                        try {
                          const res = await fetch('/api/admin/upload', {
                            method: 'POST',
                            body: formData,
                          });
                          const data = await res.json();
                          if (data.success) {
                            updateSetting('logoUrl', data.url);
                            // Auto-save the logo URL to database so it takes effect immediately
                            await fetch('/api/admin/settings', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ logoUrl: data.url }),
                            });
                            setSaved(true);
                            setTimeout(() => setSaved(false), 2000);
                          } else {
                            alert(data.error || 'Upload failed');
                          }
                        } catch {
                          alert('Upload failed');
                        }
                        e.target.value = '';
                      }}
                    />
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      <Upload className="h-4 w-4" />
                      Upload
                    </div>
                  </label>
                </div>
                {settings.logoUrl && (
                  <div className="p-6 bg-gray-100 rounded-lg flex items-center justify-center">
                    <img 
                      src={settings.logoUrl} 
                      alt="Logo preview" 
                      className="h-24 max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/logo.png';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Favicon Upload */}
              <div className="space-y-3">
                <Label>Favicon</Label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input 
                      id="faviconUrl" 
                      value={settings.faviconUrl} 
                      onChange={(e) => updateSetting('faviconUrl', e.target.value)}
                      placeholder="/favicon.svg or upload"
                    />
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,.ico"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('type', 'favicon');
                        try {
                          const res = await fetch('/api/admin/upload', {
                            method: 'POST',
                            body: formData,
                          });
                          const data = await res.json();
                          if (data.success) {
                            updateSetting('faviconUrl', data.url);
                          } else {
                            alert(data.error || 'Upload failed');
                          }
                        } catch {
                          alert('Upload failed');
                        }
                        e.target.value = '';
                      }}
                    />
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      <Upload className="h-4 w-4" />
                      Upload
                    </div>
                  </label>
                </div>
                {settings.faviconUrl && (
                  <div className="p-4 bg-gray-100 rounded-lg flex items-center gap-3">
                    <img 
                      src={settings.faviconUrl} 
                      alt="Favicon preview" 
                      className="h-8 w-8 object-contain"
                    />
                    <span className="text-sm text-muted-foreground">{settings.faviconUrl}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Colors
              </CardTitle>
              <CardDescription>Customize your portal's color scheme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => updateSetting('primaryColor', e.target.value)}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Input 
                      id="primaryColor" 
                      value={settings.primaryColor} 
                      onChange={(e) => updateSetting('primaryColor', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Input 
                      id="secondaryColor" 
                      value={settings.secondaryColor} 
                      onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <div className="flex gap-2">
                  <div 
                    className="px-4 py-2 rounded text-white text-sm font-medium"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    Primary Button
                  </div>
                  <div 
                    className="px-4 py-2 rounded text-white text-sm font-medium"
                    style={{ backgroundColor: settings.secondaryColor }}
                  >
                    Secondary Button
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legal Settings */}
      {activeSection === 'legal' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Legal entity details for impressum</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input 
                  value={settings.impressum.companyName}
                  onChange={(e) => updateNestedSetting('impressum', 'companyName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input 
                  value={settings.impressum.address}
                  onChange={(e) => updateNestedSetting('impressum', 'address', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={settings.impressum.email}
                    onChange={(e) => updateNestedSetting('impressum', 'email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input 
                    value={settings.impressum.phone}
                    onChange={(e) => updateNestedSetting('impressum', 'phone', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>VAT ID</Label>
                  <Input 
                    value={settings.impressum.vatId}
                    onChange={(e) => updateNestedSetting('impressum', 'vatId', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Register Number</Label>
                  <Input 
                    value={settings.impressum.registerNumber}
                    onChange={(e) => updateNestedSetting('impressum', 'registerNumber', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Legal Page URLs
              </CardTitle>
              <CardDescription>Configure footer legal links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Help Page (Hilfe)</Label>
                <Input 
                  value={settings.footer.hilfeUrl}
                  onChange={(e) => updateNestedSetting('footer', 'hilfeUrl', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Terms & Conditions (AGB)</Label>
                <Input 
                  value={settings.footer.agbUrl}
                  onChange={(e) => updateNestedSetting('footer', 'agbUrl', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Privacy Policy (Datenschutz)</Label>
                <Input 
                  value={settings.footer.datenschutzUrl}
                  onChange={(e) => updateNestedSetting('footer', 'datenschutzUrl', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Impressum</Label>
                <Input 
                  value={settings.footer.impressumUrl}
                  onChange={(e) => updateNestedSetting('footer', 'impressumUrl', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features Settings */}
      {activeSection === 'features' && (
        <Card>
          <CardHeader>
            <CardTitle>Portal Features</CardTitle>
            <CardDescription>Enable or disable portal features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { key: 'bookmarks', label: 'Bookmarks', desc: 'Allow users to bookmark articles' },
                { key: 'favorites', label: 'Favorites', desc: 'Allow users to mark articles as favorites' },
                { key: 'trending', label: 'Trending Section', desc: 'Show trending articles on homepage' },
              ].map(feature => (
                <div key={feature.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{feature.label}</p>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.features[feature.key as keyof typeof settings.features]}
                      onChange={(e) => updateNestedSetting('features', feature.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing & Payment Settings */}
      {activeSection === 'pricing' && (
        <div className="space-y-6">
          {/* Pricing Toggle */}
          <Card className={!settings.pricing.enabled ? 'border-orange-300 bg-orange-50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Power className="h-5 w-5" />
                Pricing Status
              </CardTitle>
              <CardDescription>Enable or disable article pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {settings.pricing.enabled ? (
                      <Badge className="bg-green-100 text-green-700">Pricing Enabled</Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-700">Pricing Disabled - Articles are FREE</Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {settings.pricing.enabled 
                      ? 'Users must pay to read full articles'
                      : 'All articles are free to read - no payment required'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.pricing.enabled}
                    onChange={(e) => updateNestedSetting('pricing', 'enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
              {!settings.pricing.enabled && (
                <div className="mt-4 p-4 bg-orange-100 border border-orange-300 rounded-lg text-orange-800">
                  <p className="font-medium">Warning: Pricing is disabled</p>
                  <p className="text-sm">All articles will be shown in full without requiring payment. Enable pricing when ready for production.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Price Configuration
              </CardTitle>
              <CardDescription>Set article pricing (applies when pricing is enabled)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="articlePrice">Article Price ({settings.pricing.currency})</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {settings.pricing.currency === 'EUR' ? '€' : settings.pricing.currency === 'USD' ? '$' : settings.pricing.currency === 'GBP' ? '£' : ''}
                    </span>
                    <Input 
                      id="articlePrice" 
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-8"
                      value={(settings.pricing.articlePriceCents / 100).toFixed(2)}
                      onChange={(e) => {
                        const euros = parseFloat(e.target.value) || 0;
                        const cents = Math.round(euros * 100);
                        updateNestedSetting('pricing', 'articlePriceCents', cents);
                      }}
                      disabled={!settings.pricing.enabled}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    = {settings.pricing.articlePriceCents} cents (internal value)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={settings.pricing.currency}
                    onChange={(e) => updateNestedSetting('pricing', 'currency', e.target.value)}
                    className="w-full h-10 px-3 border rounded-md"
                    disabled={!settings.pricing.enabled}
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CHF">CHF</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DIMOCO Payment Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                DIMOCO Payment Gateway
              </CardTitle>
              <CardDescription>Configure DIMOCO pay:smart integration for carrier billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Payment Mode</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.dimoco.useMock ? 'Using mock payments for testing' : 'Using real DIMOCO API'}
                  </p>
                </div>
                <Button
                  variant={settings.dimoco.useMock ? 'outline' : 'default'}
                  onClick={() => updateNestedSetting('dimoco', 'useMock', !settings.dimoco.useMock)}
                >
                  {settings.dimoco.useMock ? 'Switch to Real API' : 'Switch to Mock'}
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>API URL</Label>
                  <Input 
                    value={settings.dimoco.apiUrl}
                    onChange={(e) => updateNestedSetting('dimoco', 'apiUrl', e.target.value)}
                    placeholder="https://sandbox-dcb.dimoco.at/sph/payment"
                  />
                  <p className="text-xs text-muted-foreground">
                    Sandbox: https://sandbox-dcb.dimoco.at/sph/payment
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Merchant ID</Label>
                  <Input 
                    value={settings.dimoco.merchantId}
                    onChange={(e) => updateNestedSetting('dimoco', 'merchantId', e.target.value)}
                    placeholder="8000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Order ID</Label>
                  <Input 
                    value={settings.dimoco.orderId}
                    onChange={(e) => updateNestedSetting('dimoco', 'orderId', e.target.value)}
                    placeholder="8000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="flex gap-2">
                    <Input 
                      type={showApiKeys['dimoco'] ? 'text' : 'password'}
                      value={settings.dimoco.password}
                      onChange={(e) => updateNestedSetting('dimoco', 'password', e.target.value)}
                      placeholder="••••••••"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => toggleApiKeyVisibility('dimoco')}
                    >
                      {showApiKeys['dimoco'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              <div className={`p-4 rounded-lg text-sm ${
                settings.dimoco.useMock 
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                  : settings.dimoco.password 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <p className="font-medium flex items-center gap-2">
                  {settings.dimoco.useMock ? (
                    <>⚠️ Mock Mode Active</>
                  ) : settings.dimoco.password ? (
                    <>✓ DIMOCO API Configured</>
                  ) : (
                    <>✗ Password Required</>
                  )}
                </p>
                <p className="mt-1">
                  {settings.dimoco.useMock 
                    ? 'Payments are simulated. No real charges will occur.'
                    : settings.dimoco.password
                      ? `Connected to ${settings.dimoco.apiUrl.includes('sandbox') ? 'Sandbox' : 'Production'} API`
                      : 'Enter your DIMOCO credentials to enable real carrier billing.'
                  }
                </p>
              </div>

              {/* Sandbox info */}
              {settings.dimoco.apiUrl.includes('sandbox') && !settings.dimoco.useMock && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                  <p className="font-medium">Sandbox Mode</p>
                  <p>All payments will use test MSISDN: <code className="bg-blue-100 px-1 rounded">436763602302</code></p>
                  <p>Operator: AT_SANDBOX</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Keys Settings */}
      {activeSection === 'api' && (
        <div className="space-y-6">
          {/* OpenAI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                OpenAI Configuration
              </CardTitle>
              <CardDescription>API key for AI content generation agents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>OpenAI API Key</Label>
                <div className="flex gap-2">
                  <Input 
                    type={showApiKeys['openai'] ? 'text' : 'password'}
                    value={settings.openai.apiKey}
                    onChange={(e) => updateNestedSetting('openai', 'apiKey', e.target.value)}
                    placeholder="sk-..."
                    className="font-mono"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => toggleApiKeyVisibility('openai')}
                  >
                    {showApiKeys['openai'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Required for AI content generation. Get your key from openai.com</p>
              </div>
            </CardContent>
          </Card>

          {/* BrightData */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                BrightData Configuration
              </CardTitle>
              <CardDescription>Web scraping proxy for news gathering</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>API Token</Label>
                  <div className="flex gap-2">
                    <Input 
                      type={showApiKeys['brightdata'] ? 'text' : 'password'}
                      value={settings.brightdata.apiToken}
                      onChange={(e) => updateNestedSetting('brightdata', 'apiToken', e.target.value)}
                      placeholder="••••••••"
                      className="font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => toggleApiKeyVisibility('brightdata')}
                    >
                      {showApiKeys['brightdata'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Zone</Label>
                  <Input 
                    value={settings.brightdata.zone}
                    onChange={(e) => updateNestedSetting('brightdata', 'zone', e.target.value)}
                    placeholder="web_unlocker1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Configuration
              </CardTitle>
              <CardDescription>MongoDB connection settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>MongoDB URI</Label>
                <div className="flex gap-2">
                  <Input 
                    type={showApiKeys['database'] ? 'text' : 'password'}
                    value={settings.database.uri}
                    onChange={(e) => updateNestedSetting('database', 'uri', e.target.value)}
                    placeholder="mongodb+srv://user:password@cluster.mongodb.net/"
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => toggleApiKeyVisibility('database')}
                  >
                    {showApiKeys['database'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the default from .env file. Changes require server restart.
                </p>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                <p className="font-medium">Important</p>
                <p>Database URI changes require a server restart to take effect. Make sure the URI is valid before saving.</p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Admin Configuration
              </CardTitle>
              <CardDescription>Admin access settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Admin Email</Label>
                <Input 
                  type="email"
                  value={settings.admin.email}
                  onChange={(e) => updateNestedSetting('admin', 'email', e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Admin Password</Label>
                <div className="flex gap-2">
                  <Input 
                    type={showApiKeys['adminPass'] ? 'text' : 'password'}
                    value={settings.admin.password}
                    onChange={(e) => updateNestedSetting('admin', 'password', e.target.value)}
                    placeholder="Enter new password (leave empty to keep current)"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => toggleApiKeyVisibility('adminPass')}
                  >
                    {showApiKeys['adminPass'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep current password. New password takes effect immediately.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Agent Config */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Agent Configuration
              </CardTitle>
              <CardDescription>Configure automatic content generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cron Schedule</Label>
                  <Input 
                    value={settings.agentConfig.cronSchedule}
                    onChange={(e) => updateNestedSetting('agentConfig', 'cronSchedule', e.target.value)}
                    placeholder="0 */6 * * *"
                  />
                  <p className="text-xs text-muted-foreground">Default: Every 6 hours (0 */6 * * *)</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Articles Per Run</Label>
                  <Input 
                    type="number"
                    value={settings.agentConfig.maxArticlesPerRun}
                    onChange={(e) => updateNestedSetting('agentConfig', 'maxArticlesPerRun', parseInt(e.target.value) || 1)}
                    min="1"
                    max="20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <select
                    value={settings.agentConfig.defaultLanguage}
                    onChange={(e) => updateNestedSetting('agentConfig', 'defaultLanguage', e.target.value)}
                    className="w-full h-10 px-3 border rounded-md"
                  >
                    <option value="de">German (Deutsch)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Settings */}
      {activeSection === 'system' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Management
              </CardTitle>
              <CardDescription>Initialize and manage database indexes for optimal performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">
                  <strong>Database Indexes</strong> are required for production performance. 
                  Click the button below to create all necessary indexes on your MongoDB collections.
                </p>
                <p className="text-xs text-blue-600">
                  This operation is safe to run multiple times - existing indexes will be skipped.
                </p>
              </div>
              
              <Button 
                onClick={handleInitializeDatabase} 
                disabled={initializingDb}
                className="w-full sm:w-auto"
              >
                {initializingDb ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Initialize Database Indexes
                  </>
                )}
              </Button>

              {dbInitResult && (
                <div className="mt-4 space-y-4">
                  {dbInitResult.created.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium text-green-700 flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4" />
                        Indexes Created/Verified ({dbInitResult.created.length})
                      </p>
                      <ul className="text-sm text-green-600 space-y-1">
                        {dbInitResult.created.map((idx, i) => (
                          <li key={i} className="font-mono text-xs">• {idx}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {dbInitResult.errors.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-medium text-red-700 flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        Errors ({dbInitResult.errors.length})
                      </p>
                      <ul className="text-sm text-red-600 space-y-1">
                        {dbInitResult.errors.map((err, i) => (
                          <li key={i} className="font-mono text-xs">• {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database Reset - Danger Zone */}
          <Card className="border-red-200">
            <CardHeader className="bg-red-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                Danger Zone - Reset Database
              </CardTitle>
              <CardDescription className="text-red-600">
                Permanently delete data and start fresh. This action cannot be undone!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {/* Reset User Data (preserves articles) */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="font-medium text-orange-800 mb-2">
                  Reset User Data (Keep Articles)
                </p>
                <p className="text-sm text-orange-700 mb-2">
                  This will delete:
                </p>
                <ul className="text-sm text-orange-600 list-disc list-inside space-y-1 mb-3">
                  <li>All registered users and their sessions</li>
                  <li>All transactions, unlocks, and billing events</li>
                  <li>All customer records and purchases</li>
                  <li>All tracking data and analytics</li>
                  <li>All landing pages</li>
                </ul>
                <p className="text-sm text-orange-700">
                  <strong>Preserved:</strong> Articles, settings, categories
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-orange-700">
                  Type <code className="bg-orange-100 px-2 py-1 rounded font-mono">RESET_DATABASE</code> to confirm:
                </Label>
                <Input 
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  placeholder="RESET_DATABASE"
                  className="font-mono border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>

              <Button 
                onClick={handleResetDatabase}
                disabled={resettingDb || resetConfirmation !== 'RESET_DATABASE'}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {resettingDb ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting User Data...
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Reset User Data (Keep Articles)
                  </>
                )}
              </Button>

              <div className="border-t border-gray-200 pt-6">
                {/* Reset Articles */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-red-800 mb-2">
                    Reset Articles Only
                  </p>
                  <p className="text-sm text-red-700 mb-2">
                    This will permanently delete all articles and content.
                  </p>
                  <p className="text-sm text-red-700">
                    <strong>Preserved:</strong> Users, transactions, settings, categories
                  </p>
                </div>
                
                <Button 
                  onClick={async () => {
                    if (!confirm('⚠️ This will permanently delete ALL articles. Are you sure?')) return;
                    setResettingDb(true);
                    setResetResult(null);
                    try {
                      const response = await fetch('/api/admin/database/reset', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ resetType: 'RESET_ARTICLES' }),
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setResetResult(data.results);
                      } else {
                        setError(data.error || 'Failed to reset articles');
                      }
                    } catch (err) {
                      setError('Network error');
                    } finally {
                      setResettingDb(false);
                    }
                  }}
                  disabled={resettingDb}
                  variant="destructive"
                  className="w-full mt-4"
                >
                  {resettingDb ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting Articles...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Reset All Articles
                    </>
                  )}
                </Button>
              </div>

              {resetResult && (
                <div className="mt-4 space-y-4">
                  {resetResult.deleted.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium text-green-700 flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4" />
                        Data Deleted Successfully
                      </p>
                      <ul className="text-sm text-green-600 space-y-1">
                        {resetResult.deleted.map((item, i) => (
                          <li key={i} className="font-mono text-xs">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {resetResult.preserved.length > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-blue-700 flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4" />
                        Preserved
                      </p>
                      <ul className="text-sm text-blue-600 space-y-1">
                        {resetResult.preserved.map((item, i) => (
                          <li key={i} className="font-mono text-xs">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {resetResult.errors.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-medium text-red-700 flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        Errors
                      </p>
                      <ul className="text-sm text-red-600 space-y-1">
                        {resetResult.errors.map((err, i) => (
                          <li key={i} className="font-mono text-xs">• {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Environment Info</CardTitle>
              <CardDescription>Current system configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Brand ID</p>
                  <p className="font-mono">{settings.id}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Database</p>
                  <p className="font-mono">newsportal_{settings.id}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Pricing Status</p>
                  <p className="font-mono">{settings.pricing.enabled ? 'Enabled' : 'Disabled (Free)'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Version</p>
                  <p className="font-mono">1.0.0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
