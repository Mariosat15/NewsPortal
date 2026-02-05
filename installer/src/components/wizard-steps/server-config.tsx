'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ServerConfig } from '@/lib/types';
import { Server, Key, Lock, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

interface ServerConfigStepProps {
  config: ServerConfig;
  onChange: (config: ServerConfig) => void;
  onTestConnection: () => Promise<boolean>;
}

export function ServerConfigStep({ config, onChange, onTestConnection }: ServerConfigStepProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const success = await onTestConnection();
      setTestResult(success ? 'success' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Server className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Server Configuration</h2>
          <p className="text-sm text-muted-foreground">Enter your server SSH connection details</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="host">Server IP / Hostname</Label>
          <Input
            id="host"
            placeholder="192.168.1.1 or server.example.com"
            value={config.host}
            onChange={(e) => onChange({ ...config, host: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="port">SSH Port</Label>
          <Input
            id="port"
            type="number"
            placeholder="22"
            value={config.port}
            onChange={(e) => onChange({ ...config, port: parseInt(e.target.value) || 22 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">SSH Username</Label>
        <Input
          id="username"
          placeholder="root or ubuntu"
          value={config.username}
          onChange={(e) => onChange({ ...config, username: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <Label>Authentication Method</Label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => onChange({ ...config, authMethod: 'password', privateKey: '' })}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              config.authMethod === 'password'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Lock className={`h-5 w-5 mx-auto mb-2 ${config.authMethod === 'password' ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${config.authMethod === 'password' ? 'text-blue-600' : 'text-gray-600'}`}>
              Password
            </span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...config, authMethod: 'key', password: '' })}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              config.authMethod === 'key'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Key className={`h-5 w-5 mx-auto mb-2 ${config.authMethod === 'key' ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${config.authMethod === 'key' ? 'text-blue-600' : 'text-gray-600'}`}>
              SSH Key
            </span>
          </button>
        </div>
      </div>

      {config.authMethod === 'password' ? (
        <div className="space-y-2">
          <Label htmlFor="password">SSH Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your SSH password"
            value={config.password || ''}
            onChange={(e) => onChange({ ...config, password: e.target.value })}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="privateKey">Private Key (paste content)</Label>
          <textarea
            id="privateKey"
            placeholder="-----BEGIN RSA PRIVATE KEY-----..."
            value={config.privateKey || ''}
            onChange={(e) => onChange({ ...config, privateKey: e.target.value })}
            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="deployPath">Deploy Directory</Label>
        <Input
          id="deployPath"
          placeholder="/var/www/newsportal"
          value={config.deployPath}
          onChange={(e) => onChange({ ...config, deployPath: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          The directory where the application will be deployed
        </p>
      </div>

      <div className="pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleTestConnection}
          disabled={testing || !config.host || !config.username}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : testResult === 'success' ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Connection Successful!
            </>
          ) : testResult === 'error' ? (
            <>
              <XCircle className="mr-2 h-4 w-4 text-red-500" />
              Connection Failed - Try Again
            </>
          ) : (
            'Test Connection'
          )}
        </Button>
      </div>
    </div>
  );
}
