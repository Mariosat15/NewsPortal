'use client';

import { createContext, useContext } from 'react';
import { BrandConfig, defaultBrandConfig } from './config';

// Brand context for client-side usage
export const BrandContext = createContext<BrandConfig>(defaultBrandConfig);

// Hook to access brand config in client components
export function useBrand(): BrandConfig {
  const context = useContext(BrandContext);
  if (!context) {
    console.warn('useBrand must be used within a BrandProvider');
    return defaultBrandConfig;
  }
  return context;
}

// Export provider component
export { BrandContext as BrandProvider };
