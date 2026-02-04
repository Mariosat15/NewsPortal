import { getCollection } from './mongodb';

interface Settings {
  key: string;
  value: unknown;
  updatedAt: Date;
}

/**
 * Get default settings from environment variables
 * These are used to seed the database on first run
 */
function getDefaultSettings() {
  return {
    // Brand settings
    name: process.env.BRAND_NAME || 'News Portal',
    logoUrl: process.env.BRAND_LOGO_URL || '/images/logo.svg',
    faviconUrl: process.env.BRAND_FAVICON_URL || '/favicon.svg',
    primaryColor: process.env.BRAND_PRIMARY_COLOR?.trim() || '#1a73e8',
    secondaryColor: process.env.BRAND_SECONDARY_COLOR?.trim() || '#4285f4',
    
    // Pricing settings
    pricing: {
      enabled: process.env.PRICING_ENABLED === 'true',
      articlePriceCents: parseInt(process.env.ARTICLE_PRICE_CENTS || '99', 10),
      currency: process.env.PRICING_CURRENCY || 'EUR',
    },
    
    // Admin credentials (stored in DB but env is fallback)
    admin: {
      email: process.env.ADMIN_EMAIL || 'admin@newsportal.com',
      password: '', // Empty in DB - uses env password as default
    },
    
    // DIMOCO Payment settings (API credentials, not URLs)
    dimoco: {
      apiUrl: process.env.DIMOCO_API_URL || 'https://api.dimoco.eu',
      apiKey: process.env.DIMOCO_API_KEY || '',
      merchantId: process.env.DIMOCO_MERCHANT_ID || '',
      serviceId: process.env.DIMOCO_SERVICE_ID || '',
      callbackSecret: process.env.DIMOCO_CALLBACK_SECRET || '',
    },
    
    // Agent configuration
    agentConfig: {
      enabled: process.env.AGENT_ENABLED === 'true',
      intervalMinutes: parseInt(process.env.AGENT_INTERVAL_MINUTES || '60', 10),
      model: process.env.AGENT_MODEL || 'gpt-4o-mini',
      temperature: parseFloat(process.env.AGENT_TEMPERATURE || '0.7'),
      maxArticles: parseInt(process.env.AGENT_MAX_ARTICLES || '5', 10),
      rssFeeds: (process.env.AGENT_RSS_FEEDS || 'https://feeds.bbci.co.uk/news/rss.xml').split(','),
      defaultTopics: ['news', 'technology', 'sports', 'lifestyle', 'health', 'finance'],
      defaultLanguage: 'de',
    },
    
    // Template settings
    selectedTemplate: 'developer-developer',
  };
}

/**
 * Seed the database with default settings if they don't exist
 * This is called on app initialization to ensure admin can log in
 */
export async function seedDefaultSettings(brandId: string = 'brand1'): Promise<boolean> {
  try {
    const collection = await getCollection<Settings>(brandId, 'settings');
    
    // Check if settings already exist
    const existingSettings = await collection.countDocuments();
    
    if (existingSettings > 0) {
      console.log('[Seed] Settings already exist in database, skipping seed');
      return false;
    }
    
    console.log('[Seed] No settings found, seeding database with defaults...');
    
    const defaults = getDefaultSettings();
    const now = new Date();
    
    // Insert each setting as a separate document
    const documents: Settings[] = Object.entries(defaults).map(([key, value]) => ({
      key,
      value,
      updatedAt: now,
    }));
    
    await collection.insertMany(documents);
    
    console.log(`[Seed] Successfully seeded ${documents.length} default settings`);
    return true;
  } catch (error) {
    console.error('[Seed] Error seeding default settings:', error);
    return false;
  }
}

/**
 * Get a specific setting with env fallback
 */
export async function getSettingWithFallback<T>(
  brandId: string,
  key: string,
  envFallback: T
): Promise<T> {
  try {
    const collection = await getCollection<Settings>(brandId, 'settings');
    const setting = await collection.findOne({ key });
    
    if (setting?.value !== undefined) {
      return setting.value as T;
    }
    
    return envFallback;
  } catch (error) {
    console.error(`[Settings] Error getting ${key}, using fallback:`, error);
    return envFallback;
  }
}
