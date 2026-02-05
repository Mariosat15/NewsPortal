'use client';

import { DeploymentConfig } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { 
  Server, Globe, Database, CreditCard, Key, Shield, 
  CheckCircle, AlertCircle, Rocket
} from 'lucide-react';

interface ReviewDeployStepProps {
  config: DeploymentConfig;
}

export function ReviewDeployStep({ config }: ReviewDeployStepProps) {
  const sections = [
    {
      icon: Server,
      title: 'Server',
      color: 'blue',
      items: [
        { label: 'Host', value: config.server.host || 'Not set', valid: !!config.server.host },
        { label: 'Port', value: config.server.port?.toString() || '22', valid: true },
        { label: 'User', value: config.server.username || 'Not set', valid: !!config.server.username },
        { label: 'Auth', value: config.server.authMethod === 'key' ? 'SSH Key' : 'Password', valid: true },
        { label: 'Deploy Path', value: config.server.deployPath || 'Not set', valid: !!config.server.deployPath },
      ],
    },
    {
      icon: Globe,
      title: 'Domain & Branding',
      color: 'purple',
      items: [
        { label: 'Brand Name', value: config.domain.brandName || 'Not set', valid: !!config.domain.brandName },
        { label: 'Brand ID', value: config.domain.brandId || 'Not set', valid: !!config.domain.brandId },
        { label: 'Domain', value: config.domain.domain || 'Not set', valid: !!config.domain.domain },
        { label: 'Primary Color', value: config.domain.primaryColor, valid: true },
      ],
    },
    {
      icon: Database,
      title: 'Database',
      color: 'green',
      items: [
        { label: 'Type', value: config.database.useAtlas ? 'MongoDB Atlas' : 'Self-Hosted', valid: true },
        { label: 'Connection', value: config.database.mongodbUri ? '••••••••' : 'Not set', valid: !!config.database.mongodbUri },
      ],
    },
    {
      icon: CreditCard,
      title: 'Payment (DIMOCO)',
      color: 'orange',
      items: [
        { label: 'Mode', value: config.payment.useSandbox ? 'Sandbox' : 'Production', valid: true },
        { label: 'Merchant ID', value: config.payment.dimocoMerchantId || 'Not set', valid: !!config.payment.dimocoMerchantId },
        { label: 'Service ID', value: config.payment.dimocoServiceId || 'Not set', valid: !!config.payment.dimocoServiceId },
        { label: 'Article Price', value: `${(config.payment.articlePriceCents / 100).toFixed(2)} EUR`, valid: true },
      ],
    },
    {
      icon: Key,
      title: 'API Keys',
      color: 'yellow',
      items: [
        { label: 'OpenAI', value: config.apiKeys.openaiApiKey ? '••••••••' : 'Not set', valid: !!config.apiKeys.openaiApiKey },
        { label: 'BrightData', value: config.apiKeys.brightdataToken ? '••••••••' : 'Not configured', valid: true },
      ],
    },
    {
      icon: Shield,
      title: 'Admin',
      color: 'red',
      items: [
        { label: 'Email', value: config.admin.adminEmail || 'Not set', valid: !!config.admin.adminEmail },
        { label: 'Password', value: config.admin.adminPassword ? '••••••••' : 'Not set', valid: !!config.admin.adminPassword },
        { label: 'Secrets', value: config.admin.adminSecret && config.admin.authSecret ? 'Generated' : 'Missing', valid: !!config.admin.adminSecret && !!config.admin.authSecret },
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
    };
    return colors[color] || colors.blue;
  };

  const allValid = sections.every(section => section.items.every(item => item.valid));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <Rocket className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Review & Deploy</h2>
          <p className="text-sm text-muted-foreground">Verify your configuration before deploying</p>
        </div>
      </div>

      {!allValid && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Some configuration is missing</p>
              <p>Please go back and fill in all required fields before deploying.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          const sectionValid = section.items.every(item => item.valid);
          
          return (
            <div key={section.title} className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${getColorClasses(section.color)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="font-medium">{section.title}</span>
                {sectionValid ? (
                  <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500 ml-auto" />
                )}
              </div>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={`font-mono text-xs ${item.valid ? '' : 'text-red-500'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-medium mb-2">Deployment will:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Connect to your server via SSH
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Install Node.js, PM2, and Nginx (if not present)
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Upload and configure the application
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Set up SSL certificate with Let&apos;s Encrypt
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Start the application with PM2
          </li>
        </ul>
      </div>

      {allValid && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <p className="font-medium">Ready to deploy!</p>
              <p>All configuration looks good. Click the Deploy button to start.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
