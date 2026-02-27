'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CloudflareConfig } from '@/lib/types';
import { Cloud, Shield, Zap, Globe, ExternalLink, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

interface CloudflareConfigStepProps {
  config: CloudflareConfig;
  onChange: (config: CloudflareConfig) => void;
}

export function CloudflareConfigStep({ config, onChange }: CloudflareConfigStepProps) {
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<'success' | 'error' | null>(null);

  const handleVerifyToken = async () => {
    if (!config.apiToken) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch('/api/verify-cloudflare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiToken: config.apiToken }),
      });
      const data = await res.json();
      setVerifyResult(data.valid ? 'success' : 'error');
    } catch {
      setVerifyResult('error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-orange-100 rounded-lg">
          <Cloud className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Cloudflare Protection</h2>
          <p className="text-sm text-muted-foreground">Optional — add DDoS protection, CDN, and WAF</p>
        </div>
      </div>

      {/* Enable Toggle */}
      <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <input
          type="checkbox"
          id="cfEnabled"
          checked={config.enabled}
          onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
        />
        <div>
          <Label htmlFor="cfEnabled" className="font-medium text-orange-800 cursor-pointer">
            Enable Cloudflare Integration
          </Label>
          <p className="text-xs text-orange-600">
            Automatically add your domain to Cloudflare and configure DNS, SSL, and security
          </p>
        </div>
      </div>

      {config.enabled && (
        <>
          {/* Benefits */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Shield, label: 'DDoS Protection', desc: 'Absorbs attacks before they hit your server' },
              { icon: Zap, label: 'CDN & Speed', desc: 'Cache on 300+ global edge servers' },
              { icon: Globe, label: 'WAF & Bot Block', desc: 'Blocks XSS, SQLi, and malicious bots' },
              { icon: Cloud, label: 'Free SSL', desc: 'Automatic HTTPS with edge certificates' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* API Token */}
          <div className="space-y-2">
            <Label htmlFor="cfApiToken">Cloudflare API Token</Label>
            <Input
              id="cfApiToken"
              type="password"
              placeholder="Enter your Cloudflare API token"
              value={config.apiToken}
              onChange={(e) => onChange({ ...config, apiToken: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Create a token at{' '}
              <a
                href="https://dash.cloudflare.com/profile/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 underline inline-flex items-center gap-1"
              >
                Cloudflare Dashboard → API Tokens
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          {/* Required permissions info */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
            <p className="font-medium text-blue-800 mb-1">Required token permissions:</p>
            <ul className="text-blue-700 text-xs space-y-0.5 list-disc list-inside">
              <li>Zone → Zone → Edit</li>
              <li>Zone → DNS → Edit</li>
              <li>Zone → Zone Settings → Edit</li>
            </ul>
            <p className="text-blue-600 text-xs mt-1">
              Use &quot;Edit zone DNS&quot; template and add Zone Settings permission.
            </p>
          </div>

          {/* Account ID */}
          <div className="space-y-2">
            <Label htmlFor="cfAccountId">Account ID</Label>
            <Input
              id="cfAccountId"
              placeholder="e.g. 023e105f4ecef8ad9ca31a8372d0c353"
              value={config.accountId}
              onChange={(e) => onChange({ ...config, accountId: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Found in Cloudflare Dashboard → any zone → Overview → right sidebar → Account ID
            </p>
          </div>

          {/* Verify Token Button */}
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleVerifyToken}
              disabled={verifying || !config.apiToken}
              className="w-full"
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Token...
                </>
              ) : verifyResult === 'success' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Token Valid!
                </>
              ) : verifyResult === 'error' ? (
                <>
                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                  Invalid Token — Check Permissions
                </>
              ) : (
                'Verify API Token'
              )}
            </Button>
          </div>

          {/* Important note about nameservers */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="font-medium text-amber-800 text-sm mb-2">
              ⚠️ After deployment you must update nameservers
            </p>
            <p className="text-xs text-amber-700">
              Cloudflare will assign nameservers for your domain. You will need to update them 
              at your domain registrar (e.g., Hostinger, GoDaddy, Namecheap). 
              The installer will display the exact nameservers after deployment.
              DNS propagation can take up to 48 hours.
            </p>
          </div>
        </>
      )}

      {!config.enabled && (
        <div className="p-4 bg-gray-50 rounded-lg border text-center">
          <p className="text-sm text-muted-foreground">
            Cloudflare is disabled. Your site will use Nginx + Let&apos;s Encrypt directly.
            <br />
            You can always add Cloudflare later from the{' '}
            <a
              href="https://dash.cloudflare.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Cloudflare Dashboard
            </a>.
          </p>
        </div>
      )}
    </div>
  );
}
