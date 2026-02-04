// Brand configuration (client-safe)
export {
  type BrandConfig,
  defaultBrandConfig,
  getBrandConfig,
  getBrandConfigFromEnv,
  getBrandIdFromDomain,
  getBrandCSSVariables,
} from './config';

// Client-side brand context
export { BrandContext, useBrand } from './context';
export { BrandProvider } from './provider';

// NOTE: Server-side utilities (getBrandId, getBrandIdSync, getServerBrandConfig, 
// getBrandConfigAsync, loadSettingsFromDb, clearSettingsCache) must be imported 
// directly from '@/lib/brand/server' to avoid bundling MongoDB in client code.
