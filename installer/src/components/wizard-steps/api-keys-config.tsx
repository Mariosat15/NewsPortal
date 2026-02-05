'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiKeysConfig } from '@/lib/types';
import { Key, ExternalLink, Info } from 'lucide-react';

interface ApiKeysConfigStepProps {
  config: ApiKeysConfig;
  onChange: (config: ApiKeysConfig) => void;
}

export function ApiKeysConfigStep({ config, onChange }: ApiKeysConfigStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-yellow-100 rounded-lg">
          <Key className="h-6 w-6 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground">Configure external service integrations</p>
        </div>
      </div>

      {/* OpenAI */}
      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <Label className="text-base">OpenAI API Key</Label>
              <p className="text-xs text-muted-foreground">Required for AI content generation</p>
            </div>
          </div>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            Get API Key <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        
        <Input
          type="password"
          placeholder="sk-..."
          value={config.openaiApiKey}
          onChange={(e) => onChange({ ...config, openaiApiKey: e.target.value })}
          className="font-mono"
        />
        
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex gap-2">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p>The AI agents use OpenAI to generate and edit articles automatically.</p>
              <p className="mt-1">Recommended: GPT-4 access for best quality content.</p>
            </div>
          </div>
        </div>
      </div>

      {/* BrightData */}
      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <div>
              <Label className="text-base">BrightData API Token</Label>
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Optional</span>
            </div>
          </div>
          <a
            href="https://brightdata.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            Get Token <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <p className="text-xs text-muted-foreground">For advanced web scraping capabilities</p>
        
        <Input
          type="password"
          placeholder="Your BrightData API token"
          value={config.brightdataToken || ''}
          onChange={(e) => onChange({ ...config, brightdataToken: e.target.value })}
        />

        <div className="space-y-2">
          <Label htmlFor="brightdataZone" className="text-sm">BrightData Zone</Label>
          <Input
            id="brightdataZone"
            placeholder="web_unlocker1"
            value={config.brightdataZone || ''}
            onChange={(e) => onChange({ ...config, brightdataZone: e.target.value })}
          />
        </div>

        <div className="p-3 bg-gray-50 rounded-lg border">
          <p className="text-xs text-gray-600">
            BrightData enables the AI agents to scrape content from websites that may block regular requests. 
            This is optional - the system will work without it but may have limited scraping capabilities.
          </p>
        </div>
      </div>
    </div>
  );
}
