'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, ChevronRight, Rocket, 
  Server, Globe, Database, CreditCard, Key, Shield, CheckCircle
} from 'lucide-react';

import { ServerConfigStep } from '@/components/wizard-steps/server-config';
import { DomainConfigStep } from '@/components/wizard-steps/domain-config';
import { DatabaseConfigStep } from '@/components/wizard-steps/database-config';
import { PaymentConfigStep } from '@/components/wizard-steps/payment-config';
import { ApiKeysConfigStep } from '@/components/wizard-steps/api-keys-config';
import { AdminConfigStep } from '@/components/wizard-steps/admin-config';
import { ReviewDeployStep } from '@/components/wizard-steps/review-deploy';
import { DeploymentProgressComponent } from '@/components/deployment-progress';

import { 
  DeploymentConfig, 
  ServerConfig, 
  DomainConfig, 
  DatabaseConfig, 
  PaymentConfig, 
  ApiKeysConfig, 
  AdminConfig,
  DeploymentProgress 
} from '@/lib/types';
import { generateSecureSecret } from '@/lib/utils';

const STEPS = [
  { id: 'server', title: 'Server', icon: Server, description: 'SSH connection details' },
  { id: 'domain', title: 'Domain', icon: Globe, description: 'Brand and domain' },
  { id: 'database', title: 'Database', icon: Database, description: 'MongoDB setup' },
  { id: 'payment', title: 'Payment', icon: CreditCard, description: 'DIMOCO config' },
  { id: 'apiKeys', title: 'API Keys', icon: Key, description: 'External services' },
  { id: 'admin', title: 'Admin', icon: Shield, description: 'Admin access' },
  { id: 'review', title: 'Review', icon: CheckCircle, description: 'Deploy' },
];

const initialConfig: DeploymentConfig = {
  server: {
    host: '',
    port: 22,
    username: 'root',
    authMethod: 'password',
    password: '',
    privateKey: '',
    deployPath: '/var/www/newsportal',
  },
  domain: {
    brandId: '',
    brandName: '',
    domain: '',
    primaryColor: '#1a73e8',
    secondaryColor: '#4285f4',
  },
  database: {
    mongodbUri: '',
    useAtlas: true,
  },
  payment: {
    dimocoApiUrl: 'https://sandbox.2pay.global/smartlink',
    dimocoMerchantId: '',
    dimocoServiceId: '',
    dimocoApiKey: '',
    dimocoCallbackSecret: '',
    articlePriceCents: 99,
    useSandbox: true,
  },
  apiKeys: {
    openaiApiKey: '',
    brightdataToken: '',
    brightdataZone: 'web_unlocker1',
  },
  admin: {
    adminEmail: '',
    adminPassword: '',
    adminSecret: '',
    authSecret: '',
  },
};

export default function InstallerPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<DeploymentConfig>(initialConfig);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState<DeploymentProgress | null>(null);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTestConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config.server),
      });
      const data = await response.json();
      return data.success;
    } catch {
      return false;
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    
    // Initialize progress
    const initialProgress: DeploymentProgress = {
      currentStep: 'connect',
      steps: [
        { id: 'connect', name: 'Connecting to server', status: 'pending' },
        { id: 'upload', name: 'Uploading application', status: 'pending' },
        { id: 'env', name: 'Configuring environment', status: 'pending' },
        { id: 'deps', name: 'Installing dependencies', status: 'pending' },
        { id: 'build', name: 'Building application', status: 'pending' },
        { id: 'nginx', name: 'Configuring Nginx', status: 'pending' },
        { id: 'ssl', name: 'Setting up SSL', status: 'pending' },
        { id: 'start', name: 'Starting application', status: 'pending' },
      ],
      isComplete: false,
      logs: ['Starting deployment...'],
    };
    
    setDeploymentProgress(initialProgress);

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              setDeploymentProgress(prev => {
                if (!prev) return prev;
                
                const newSteps = prev.steps.map(step => {
                  if (step.id === data.stepId) {
                    return { ...step, status: data.status, message: data.message };
                  }
                  return step;
                });

                return {
                  ...prev,
                  currentStep: data.stepId,
                  steps: newSteps,
                  logs: [...prev.logs, data.log || data.message].filter(Boolean),
                  isComplete: data.complete || false,
                  error: data.error,
                };
              });
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      setDeploymentProgress(prev => prev ? {
        ...prev,
        isComplete: true,
        error: error instanceof Error ? error.message : 'Deployment failed',
        logs: [...prev.logs, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      } : null);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ServerConfigStep
            config={config.server}
            onChange={(server) => setConfig({ ...config, server })}
            onTestConnection={handleTestConnection}
          />
        );
      case 1:
        return (
          <DomainConfigStep
            config={config.domain}
            onChange={(domain) => setConfig({ ...config, domain })}
          />
        );
      case 2:
        return (
          <DatabaseConfigStep
            config={config.database}
            onChange={(database) => setConfig({ ...config, database })}
            brandId={config.domain.brandId}
          />
        );
      case 3:
        return (
          <PaymentConfigStep
            config={config.payment}
            onChange={(payment) => setConfig({ ...config, payment })}
          />
        );
      case 4:
        return (
          <ApiKeysConfigStep
            config={config.apiKeys}
            onChange={(apiKeys) => setConfig({ ...config, apiKeys })}
          />
        );
      case 5:
        return (
          <AdminConfigStep
            config={config.admin}
            onChange={(admin) => setConfig({ ...config, admin })}
          />
        );
      case 6:
        return <ReviewDeployStep config={config} />;
      default:
        return null;
    }
  };

  if (isDeploying && deploymentProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="w-full max-w-3xl">
          <CardContent className="p-8">
            <DeploymentProgressComponent 
              progress={deploymentProgress} 
              deployedUrl={config.domain.domain}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Rocket className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">News Portal Installer</h1>
                <p className="text-sm text-muted-foreground">Plug & Play Deployment Wizard</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              Step {currentStep + 1} of {STEPS.length}
            </Badge>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={`flex flex-col items-center gap-1 flex-1 transition-all ${
                    isActive ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className={`p-2 rounded-full transition-colors ${
                    isCompleted 
                      ? 'bg-green-100 text-green-600'
                      : isActive 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${
                    isActive ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>
      </main>

      {/* Footer Navigation */}
      <footer className="border-t bg-white sticky bottom-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button onClick={handleDeploy} className="bg-green-600 hover:bg-green-700">
                <Rocket className="h-4 w-4 mr-2" />
                Deploy Now
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
