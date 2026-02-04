// Brand configuration
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

// Server-side brand utilities
export { getBrandId, getServerBrandConfig, getBrandIdSync } from './server';
