'use client';

import { DeploymentProgress, DeploymentStep } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, XCircle, Loader2, Circle,
  Server, Upload, FileCode, Package, Hammer, 
  Globe, Lock, Play, ExternalLink, Cloud
} from 'lucide-react';
import { useEffect, useRef } from 'react';

interface DeploymentProgressProps {
  progress: DeploymentProgress;
  onClose?: () => void;
  deployedUrl?: string;
}

const stepIcons: Record<string, React.ElementType> = {
  connect: Server,
  upload: Upload,
  env: FileCode,
  deps: Package,
  build: Hammer,
  nginx: Globe,
  ssl: Lock,
  cloudflare: Cloud,
  start: Play,
};

export function DeploymentProgressComponent({ progress, onClose, deployedUrl }: DeploymentProgressProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progress.logs]);

  const getStepIcon = (step: DeploymentStep) => {
    const Icon = stepIcons[step.id] || Circle;
    
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Icon className="h-5 w-5 text-gray-300" />;
    }
  };

  const getStepBadge = (status: DeploymentStep['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Complete</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="default">Running</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">
          {progress.isComplete 
            ? (progress.error ? 'Deployment Failed' : 'Deployment Complete!') 
            : 'Deploying...'}
        </h2>
        <p className="text-muted-foreground">
          {progress.isComplete
            ? (progress.error 
                ? 'There was an error during deployment' 
                : 'Your News Portal is now live!')
            : 'Please wait while we set up your server...'}
        </p>
      </div>

      {/* Steps Progress */}
      <div className="space-y-3">
        {progress.steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
              step.status === 'running' 
                ? 'border-blue-200 bg-blue-50' 
                : step.status === 'error'
                ? 'border-red-200 bg-red-50'
                : step.status === 'completed'
                ? 'border-green-200 bg-green-50'
                : 'border-gray-100 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm">
              {getStepIcon(step)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{step.name}</span>
                {getStepBadge(step.status)}
              </div>
              {step.message && (
                <p className="text-sm text-muted-foreground mt-1">{step.message}</p>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              Step {index + 1}/{progress.steps.length}
            </span>
          </div>
        ))}
      </div>

      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Overall Progress</span>
          <span>
            {progress.steps.filter(s => s.status === 'completed').length}/{progress.steps.length} steps
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              progress.error ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{
              width: `${(progress.steps.filter(s => s.status === 'completed').length / progress.steps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Logs */}
      <div className="space-y-2">
        <h3 className="font-medium">Deployment Logs</h3>
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 h-64 overflow-auto font-mono text-xs">
          {progress.logs.map((log, index) => (
            <div key={index} className="py-0.5">
              <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>{' '}
              <span className={
                log.includes('Error') || log.includes('error') || log.includes('failed')
                  ? 'text-red-400'
                  : log.includes('Success') || log.includes('success') || log.includes('completed')
                  ? 'text-green-400'
                  : log.includes('Starting') || log.includes('Running')
                  ? 'text-blue-400'
                  : 'text-gray-300'
              }>
                {log}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Success State */}
      {progress.isComplete && !progress.error && deployedUrl && (
        <div className="p-6 bg-green-50 rounded-lg border border-green-200 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Your News Portal is Live!
          </h3>
          <p className="text-green-700 mb-4">
            Access your site at:
          </p>
          <a
            href={`https://${deployedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            https://{deployedUrl}
          </a>
          <div className="mt-4 text-sm text-green-600">
            <p>Admin Panel: <a href={`https://${deployedUrl}/admin`} target="_blank" rel="noopener noreferrer" className="underline">https://{deployedUrl}/admin</a></p>
          </div>
        </div>
      )}

      {/* Error State */}
      {progress.error && (
        <div className="p-6 bg-red-50 rounded-lg border border-red-200">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2 text-center">
            Deployment Failed
          </h3>
          <p className="text-red-700 text-center mb-4">
            {progress.error}
          </p>
          <div className="text-sm text-red-600 bg-red-100 p-3 rounded">
            <p className="font-medium">Troubleshooting tips:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Check your server credentials and try again</li>
              <li>Ensure your server has sufficient resources</li>
              <li>Verify your domain DNS is properly configured</li>
              <li>Check the logs above for more details</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
