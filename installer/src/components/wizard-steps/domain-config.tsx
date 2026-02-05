'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DomainConfig } from '@/lib/types';
import { Globe, Palette } from 'lucide-react';
import { slugify } from '@/lib/utils';
import { useEffect } from 'react';

interface DomainConfigStepProps {
  config: DomainConfig;
  onChange: (config: DomainConfig) => void;
}

export function DomainConfigStep({ config, onChange }: DomainConfigStepProps) {
  // Auto-generate brand ID from brand name
  useEffect(() => {
    if (config.brandName && !config.brandId) {
      onChange({ ...config, brandId: slugify(config.brandName) });
    }
  }, [config.brandName]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 rounded-lg">
          <Globe className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Domain & Branding</h2>
          <p className="text-sm text-muted-foreground">Configure your brand identity and domain</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brandName">Brand Name</Label>
        <Input
          id="brandName"
          placeholder="My News Site"
          value={config.brandName}
          onChange={(e) => onChange({ ...config, brandName: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          This will be displayed in the header and page titles
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brandId">Brand ID</Label>
        <Input
          id="brandId"
          placeholder="my-news-site"
          value={config.brandId}
          onChange={(e) => onChange({ ...config, brandId: slugify(e.target.value) })}
        />
        <p className="text-xs text-muted-foreground">
          Unique identifier for the brand (auto-generated from name, lowercase, no spaces)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain">Domain Name</Label>
        <Input
          id="domain"
          placeholder="mynewssite.com"
          value={config.domain}
          onChange={(e) => onChange({ ...config, domain: e.target.value.replace(/^https?:\/\//, '').replace(/\/$/, '') })}
        />
        <p className="text-xs text-muted-foreground">
          Your domain without http/https (e.g., mynewssite.com)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sslEmail">SSL Certificate Email</Label>
        <Input
          id="sslEmail"
          type="email"
          placeholder="admin@example.com"
          value={config.sslEmail}
          onChange={(e) => onChange({ ...config, sslEmail: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Email for Let&apos;s Encrypt SSL certificate notifications (expiry warnings, etc.)
        </p>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <Label>Brand Colors</Label>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor" className="text-sm">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="primaryColor"
                value={config.primaryColor}
                onChange={(e) => onChange({ ...config, primaryColor: e.target.value })}
                className="w-14 h-9 p-1 cursor-pointer"
              />
              <Input
                value={config.primaryColor}
                onChange={(e) => onChange({ ...config, primaryColor: e.target.value })}
                placeholder="#1a73e8"
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor" className="text-sm">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="secondaryColor"
                value={config.secondaryColor}
                onChange={(e) => onChange({ ...config, secondaryColor: e.target.value })}
                className="w-14 h-9 p-1 cursor-pointer"
              />
              <Input
                value={config.secondaryColor}
                onChange={(e) => onChange({ ...config, secondaryColor: e.target.value })}
                placeholder="#4285f4"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Color Preview */}
        <div className="p-4 rounded-lg bg-gray-50 border">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <div className="flex gap-2 items-center">
            <div
              className="w-20 h-8 rounded-md shadow-sm flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: config.primaryColor }}
            >
              Primary
            </div>
            <div
              className="w-20 h-8 rounded-md shadow-sm flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: config.secondaryColor }}
            >
              Secondary
            </div>
            <div className="flex-1 h-8 rounded-md border flex items-center px-3">
              <span style={{ color: config.primaryColor }} className="font-semibold text-sm">
                {config.brandName || 'Brand Name'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
