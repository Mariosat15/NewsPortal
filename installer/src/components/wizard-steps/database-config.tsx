'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatabaseConfig } from '@/lib/types';
import { Database, ExternalLink, Info } from 'lucide-react';

interface DatabaseConfigStepProps {
  config: DatabaseConfig;
  onChange: (config: DatabaseConfig) => void;
  brandId: string;
}

export function DatabaseConfigStep({ config, onChange, brandId }: DatabaseConfigStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 rounded-lg">
          <Database className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Database Setup</h2>
          <p className="text-sm text-muted-foreground">Configure your MongoDB connection</p>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Database Provider</Label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => onChange({ ...config, useAtlas: true })}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              config.useAtlas
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl">☁️</span>
            </div>
            <span className={`text-sm font-medium ${config.useAtlas ? 'text-green-600' : 'text-gray-600'}`}>
              MongoDB Atlas
            </span>
            <p className="text-xs text-muted-foreground mt-1">Cloud-hosted (recommended)</p>
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...config, useAtlas: false })}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              !config.useAtlas
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl">🖥️</span>
            </div>
            <span className={`text-sm font-medium ${!config.useAtlas ? 'text-green-600' : 'text-gray-600'}`}>
              Self-Hosted
            </span>
            <p className="text-xs text-muted-foreground mt-1">Your own MongoDB server</p>
          </button>
        </div>
      </div>

      {config.useAtlas && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-2">MongoDB Atlas Setup Guide:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Go to <a href="https://cloud.mongodb.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">MongoDB Atlas <ExternalLink className="h-3 w-3" /></a></li>
                <li>Create a free cluster (M0 tier is free)</li>
                <li>Create a database user with read/write access</li>
                <li>Add your server IP to the Network Access whitelist (or 0.0.0.0/0 for all IPs)</li>
                <li>Click &quot;Connect&quot; → &quot;Connect your application&quot; → Copy the connection string</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="mongodbUri">MongoDB Connection String</Label>
        <Input
          id="mongodbUri"
          type="password"
          placeholder={config.useAtlas 
            ? `mongodb+srv://username:password@cluster.mongodb.net/newsportal_${brandId || 'brand'}?retryWrites=true&w=majority`
            : 'mongodb://localhost:27017/newsportal'
          }
          value={config.mongodbUri}
          onChange={(e) => onChange({ ...config, mongodbUri: e.target.value })}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {config.useAtlas 
            ? 'Paste your Atlas connection string (replace <password> with your actual password)'
            : 'Enter your MongoDB server connection string'
          }
        </p>
      </div>

      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex gap-2">
          <span className="text-yellow-600">⚠️</span>
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Important:</p>
            <p>Make sure the database name in your connection string is unique for this brand (e.g., <code className="bg-yellow-100 px-1 rounded">newsportal_{brandId || 'brand'}</code>)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
