'use client';

import { ReactNode } from 'react';
import { BrandContext } from './context';
import { BrandConfig } from './config';

interface BrandProviderProps {
  children: ReactNode;
  config: BrandConfig;
}

export function BrandProvider({ children, config }: BrandProviderProps) {
  return (
    <BrandContext.Provider value={config}>
      {children}
    </BrandContext.Provider>
  );
}
