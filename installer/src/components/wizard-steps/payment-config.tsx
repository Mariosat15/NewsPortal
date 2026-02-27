'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentConfig } from '@/lib/types';
import { CreditCard, Info, ToggleLeft, ToggleRight } from 'lucide-react';
import { generateSecureSecret } from '@/lib/utils';
import { useEffect } from 'react';

interface PaymentConfigStepProps {
  config: PaymentConfig;
  onChange: (config: PaymentConfig) => void;
}

export function PaymentConfigStep({ config, onChange }: PaymentConfigStepProps) {
  // Auto-generate callback secret if not set
  useEffect(() => {
    if (!config.dimocoCallbackSecret) {
      onChange({ ...config, dimocoCallbackSecret: generateSecureSecret(32) });
    }
  }, []);

  const toggleSandbox = () => {
    const newUseSandbox = !config.useSandbox;
    onChange({
      ...config,
      useSandbox: newUseSandbox,
      dimocoApiUrl: newUseSandbox 
        ? 'https://sandbox-dcb.dimoco.at/sph/payment' 
        : 'https://services.dimoco.at/smart/payment',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-orange-100 rounded-lg">
          <CreditCard className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Payment Configuration</h2>
          <p className="text-sm text-muted-foreground">Configure DIMOCO carrier billing</p>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
        <div>
          <Label className="text-base">Environment Mode</Label>
          <p className="text-sm text-muted-foreground">
            {config.useSandbox ? 'Using sandbox for testing' : 'Using production for live payments'}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleSandbox}
          className="flex items-center gap-2"
        >
          {config.useSandbox ? (
            <ToggleRight className="h-8 w-8 text-blue-600" />
          ) : (
            <ToggleLeft className="h-8 w-8 text-gray-400" />
          )}
          <span className={`text-sm font-medium ${config.useSandbox ? 'text-blue-600' : 'text-gray-600'}`}>
            {config.useSandbox ? 'Sandbox' : 'Production'}
          </span>
        </button>
      </div>

      {config.useSandbox && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Sandbox Mode</p>
              <p>Payments will be simulated. Switch to Production when ready for live payments.</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="dimocoApiUrl">DIMOCO API URL</Label>
        <Input
          id="dimocoApiUrl"
          placeholder="https://services.dimoco.at/smart/payment"
          value={config.dimocoApiUrl}
          onChange={(e) => onChange({ ...config, dimocoApiUrl: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Production: https://services.dimoco.at/smart/payment | Sandbox: https://sandbox-dcb.dimoco.at/sph/payment
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dimocoMerchantId">Merchant ID</Label>
          <Input
            id="dimocoMerchantId"
            placeholder="your-merchant-id"
            value={config.dimocoMerchantId}
            onChange={(e) => onChange({ ...config, dimocoMerchantId: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dimocoServiceId">Service ID</Label>
          <Input
            id="dimocoServiceId"
            placeholder="your-service-id"
            value={config.dimocoServiceId}
            onChange={(e) => onChange({ ...config, dimocoServiceId: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dimocoApiKey">API Key / Shared Secret</Label>
        <Input
          id="dimocoApiKey"
          type="password"
          placeholder="Your DIMOCO API key"
          value={config.dimocoApiKey}
          onChange={(e) => onChange({ ...config, dimocoApiKey: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dimocoCallbackSecret">Callback Secret (auto-generated)</Label>
        <div className="flex gap-2">
          <Input
            id="dimocoCallbackSecret"
            value={config.dimocoCallbackSecret}
            onChange={(e) => onChange({ ...config, dimocoCallbackSecret: e.target.value })}
            className="font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => onChange({ ...config, dimocoCallbackSecret: generateSecureSecret(32) })}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Regenerate
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Used to verify callback requests from DIMOCO
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="articlePriceCents">Article Price (in cents)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="articlePriceCents"
            type="number"
            placeholder="99"
            value={config.articlePriceCents}
            onChange={(e) => onChange({ ...config, articlePriceCents: parseInt(e.target.value) || 99 })}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground">
            = {((config.articlePriceCents || 99) / 100).toFixed(2)} EUR per article
          </span>
        </div>
      </div>
    </div>
  );
}
