'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminConfig } from '@/lib/types';
import { Shield, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { generateSecureSecret } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface AdminConfigStepProps {
  config: AdminConfig;
  onChange: (config: AdminConfig) => void;
}

export function AdminConfigStep({ config, onChange }: AdminConfigStepProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Auto-generate secrets if not set
  useEffect(() => {
    if (!config.adminSecret || !config.authSecret) {
      onChange({
        ...config,
        adminSecret: config.adminSecret || generateSecureSecret(32),
        authSecret: config.authSecret || generateSecureSecret(64),
      });
    }
  }, []);

  const generatePassword = () => {
    const password = generateSecureSecret(16);
    onChange({ ...config, adminPassword: password });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red-100 rounded-lg">
          <Shield className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Admin Setup</h2>
          <p className="text-sm text-muted-foreground">Configure administrator access</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminEmail">Admin Email</Label>
        <Input
          id="adminEmail"
          type="email"
          placeholder="admin@yourdomain.com"
          value={config.adminEmail}
          onChange={(e) => onChange({ ...config, adminEmail: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Used for admin login and SSL certificate registration
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminPassword">Admin Password</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="adminPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Choose a strong password"
              value={config.adminPassword}
              onChange={(e) => onChange({ ...config, adminPassword: e.target.value })}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={generatePassword}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Generate
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Minimum 8 characters. Use the generate button for a secure random password.
        </p>
      </div>

      <div className="pt-4 border-t space-y-4">
        <p className="text-sm font-medium text-gray-700">Security Secrets (auto-generated)</p>
        
        <div className="space-y-2">
          <Label htmlFor="adminSecret" className="text-sm">Admin Secret Token</Label>
          <div className="flex gap-2">
            <Input
              id="adminSecret"
              value={config.adminSecret}
              onChange={(e) => onChange({ ...config, adminSecret: e.target.value })}
              className="font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => onChange({ ...config, adminSecret: generateSecureSecret(32) })}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="authSecret" className="text-sm">Authentication Secret</Label>
          <div className="flex gap-2">
            <Input
              id="authSecret"
              value={config.authSecret}
              onChange={(e) => onChange({ ...config, authSecret: e.target.value })}
              className="font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => onChange({ ...config, authSecret: generateSecureSecret(64) })}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs text-yellow-800">
            <strong>Important:</strong> These secrets are used to secure your application. 
            They are auto-generated and should not be shared or changed after deployment.
          </p>
        </div>
      </div>
    </div>
  );
}
