import { z } from 'zod';

export const serverConfigSchema = z.object({
  host: z.string().min(1, 'Server host is required'),
  port: z.number().min(1).max(65535).default(22),
  username: z.string().min(1, 'Username is required'),
  authMethod: z.enum(['password', 'key']),
  password: z.string().optional(),
  privateKey: z.string().optional(),
  deployPath: z.string().min(1, 'Deploy path is required').regex(/^\//, 'Must be an absolute path'),
}).refine((data) => {
  if (data.authMethod === 'password') {
    return !!data.password && data.password.length > 0;
  }
  if (data.authMethod === 'key') {
    return !!data.privateKey && data.privateKey.length > 0;
  }
  return true;
}, {
  message: 'Authentication credentials are required',
});

export const domainConfigSchema = z.object({
  brandId: z.string()
    .min(1, 'Brand ID is required')
    .max(50, 'Brand ID must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Brand ID must be lowercase letters, numbers, and hyphens only'),
  brandName: z.string().min(1, 'Brand name is required').max(100),
  domain: z.string()
    .min(1, 'Domain is required')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, 'Invalid domain format'),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
});

export const databaseConfigSchema = z.object({
  mongodbUri: z.string()
    .min(1, 'MongoDB URI is required')
    .regex(/^mongodb(\+srv)?:\/\//, 'Must be a valid MongoDB connection string'),
  useAtlas: z.boolean(),
});

export const paymentConfigSchema = z.object({
  dimocoApiUrl: z.string().url('Must be a valid URL'),
  dimocoMerchantId: z.string().min(1, 'Merchant ID is required'),
  dimocoServiceId: z.string().min(1, 'Service ID is required'),
  dimocoApiKey: z.string().min(1, 'API key is required'),
  dimocoCallbackSecret: z.string().min(16, 'Callback secret must be at least 16 characters'),
  articlePriceCents: z.number().min(1, 'Price must be at least 1 cent').max(100000),
  useSandbox: z.boolean(),
});

export const apiKeysConfigSchema = z.object({
  openaiApiKey: z.string()
    .min(1, 'OpenAI API key is required')
    .startsWith('sk-', 'OpenAI API key must start with "sk-"'),
  brightdataToken: z.string().optional(),
  brightdataZone: z.string().optional(),
});

export const adminConfigSchema = z.object({
  adminEmail: z.string().email('Must be a valid email address'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  adminSecret: z.string().min(16, 'Admin secret must be at least 16 characters'),
  authSecret: z.string().min(32, 'Auth secret must be at least 32 characters'),
});

export const deploymentConfigSchema = z.object({
  server: serverConfigSchema,
  domain: domainConfigSchema,
  database: databaseConfigSchema,
  payment: paymentConfigSchema,
  apiKeys: apiKeysConfigSchema,
  admin: adminConfigSchema,
});

export type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string[]>;
};

export function validateServerConfig(config: unknown): ValidationResult {
  const result = serverConfigSchema.safeParse(config);
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  return formatErrors(result.error);
}

export function validateDomainConfig(config: unknown): ValidationResult {
  const result = domainConfigSchema.safeParse(config);
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  return formatErrors(result.error);
}

export function validateDatabaseConfig(config: unknown): ValidationResult {
  const result = databaseConfigSchema.safeParse(config);
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  return formatErrors(result.error);
}

export function validatePaymentConfig(config: unknown): ValidationResult {
  const result = paymentConfigSchema.safeParse(config);
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  return formatErrors(result.error);
}

export function validateApiKeysConfig(config: unknown): ValidationResult {
  const result = apiKeysConfigSchema.safeParse(config);
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  return formatErrors(result.error);
}

export function validateAdminConfig(config: unknown): ValidationResult {
  const result = adminConfigSchema.safeParse(config);
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  return formatErrors(result.error);
}

export function validateDeploymentConfig(config: unknown): ValidationResult {
  const result = deploymentConfigSchema.safeParse(config);
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  return formatErrors(result.error);
}

function formatErrors(error: z.ZodError): ValidationResult {
  const errors: Record<string, string[]> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }
  
  return { isValid: false, errors };
}
