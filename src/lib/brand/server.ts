import { cookies, headers } from 'next/headers';
import { getBrandConfig, getBrandConfigFromEnv, getBrandIdFromDomain, type BrandConfig } from './config';
import { getCollection } from '@/lib/db/mongodb';

// Cache for database settings (TTL: 5 minutes)
let settingsCache: { data: Partial<BrandConfig> | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Load settings from database (server-only)
export async function loadSettingsFromDb(brandId: string): Promise<Partial<BrandConfig>> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (settingsCache.data && (now - settingsCache.timestamp) < CACHE_TTL) {
    return settingsCache.data;
  }

  try {
    const collection = await getCollection<{ key: string; value: unknown }>(brandId, 'settings');
    
    const settingsArray = await collection.find({}).toArray();
    const settings: Record<string, unknown> = {};
    
    for (const setting of settingsArray) {
      settings[setting.key] = setting.value;
    }

    // Update cache
    settingsCache = {
      data: settings as Partial<BrandConfig>,
      timestamp: now,
    };

    return settings as Partial<BrandConfig>;
  } catch (error) {
    console.error('Failed to load settings from database:', error);
    return {};
  }
}

// Clear settings cache (call after updating settings)
export function clearSettingsCache(): void {
  settingsCache = { data: null, timestamp: 0 };
}

// Get brand config with database settings merged (async version - server only)
export async function getBrandConfigAsync(brandId?: string): Promise<BrandConfig> {
  const effectiveBrandId = brandId || process.env.BRAND_ID || 'brand1';
  const envConfig = getBrandConfigFromEnv();
  
  try {
    const dbSettings = await loadSettingsFromDb(effectiveBrandId);
    
    // Deep merge database settings with env config
    const mergedConfig: BrandConfig = {
      ...envConfig,
      id: effectiveBrandId,
      name: (dbSettings.name as string) || envConfig.name,
      domain: (dbSettings.domain as string) || envConfig.domain,
      logoUrl: (dbSettings.logoUrl as string) || envConfig.logoUrl,
      primaryColor: (dbSettings.primaryColor as string) || envConfig.primaryColor,
      secondaryColor: (dbSettings.secondaryColor as string) || envConfig.secondaryColor,
      impressum: {
        ...envConfig.impressum,
        ...(dbSettings.impressum as Partial<BrandConfig['impressum']> || {}),
      },
      footer: {
        ...envConfig.footer,
        ...(dbSettings.footer as Partial<BrandConfig['footer']> || {}),
      },
      features: {
        ...envConfig.features,
        ...(dbSettings.features as Partial<BrandConfig['features']> || {}),
      },
      agentConfig: {
        ...envConfig.agentConfig,
        ...(dbSettings.agentConfig as Partial<BrandConfig['agentConfig']> || {}),
      },
    };

    return mergedConfig;
  } catch (error) {
    console.error('Failed to get async brand config:', error);
    return { ...envConfig, id: effectiveBrandId };
  }
}

// Get brand ID from request context (server-side)
export async function getBrandId(): Promise<string> {
  try {
    // Try to get from cookie first
    const cookieStore = await cookies();
    const brandCookie = cookieStore.get('BRAND_ID');
    if (brandCookie?.value) {
      return brandCookie.value;
    }

    // Fallback to host header
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    return getBrandIdFromDomain(host);
  } catch {
    // Fallback for static generation
    return process.env.BRAND_ID || 'brand1';
  }
}

// Get brand config for server components (loads from database)
export async function getServerBrandConfig(): Promise<BrandConfig> {
  const brandId = await getBrandId();
  return getBrandConfigAsync(brandId);
}

// Utility to get brand ID synchronously from environment (for API routes)
export function getBrandIdSync(): string {
  return process.env.BRAND_ID || 'brand1';
}
