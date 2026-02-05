export interface ServerConfig {
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key';
  password?: string;
  privateKey?: string;
  deployPath: string;
}

export interface DomainConfig {
  brandId: string;
  brandName: string;
  domain: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface DatabaseConfig {
  mongodbUri: string;
  useAtlas: boolean;
}

export interface PaymentConfig {
  dimocoApiUrl: string;
  dimocoMerchantId: string;
  dimocoServiceId: string;
  dimocoApiKey: string;
  dimocoCallbackSecret: string;
  articlePriceCents: number;
  useSandbox: boolean;
}

export interface ApiKeysConfig {
  openaiApiKey: string;
  brightdataToken?: string;
  brightdataZone?: string;
}

export interface AdminConfig {
  adminEmail: string;
  adminPassword: string;
  adminSecret: string;
  authSecret: string;
}

export interface DeploymentConfig {
  server: ServerConfig;
  domain: DomainConfig;
  database: DatabaseConfig;
  payment: PaymentConfig;
  apiKeys: ApiKeysConfig;
  admin: AdminConfig;
}

export interface DeploymentStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
  progress?: number;
}

export interface DeploymentProgress {
  currentStep: string;
  steps: DeploymentStep[];
  isComplete: boolean;
  error?: string;
  logs: string[];
}
