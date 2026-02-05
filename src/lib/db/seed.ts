import { getCollection } from './mongodb';

interface Settings {
  key: string;
  value: unknown;
  updatedAt: Date;
}

/**
 * Default categories for the news portal
 * These match the categories manager defaults
 */
function getDefaultCategories() {
  return [
    { id: '1', name: 'News', slug: 'news', description: 'Breaking news and current events', color: '#3b82f6', icon: 'news', enabled: true, contentTypes: ['news', 'analysis'], order: 0 },
    { id: '2', name: 'Technology', slug: 'technology', description: 'Tech news, gadgets, and innovations', color: '#8b5cf6', icon: 'technology', enabled: true, contentTypes: ['news', 'review', 'guide'], order: 1 },
    { id: '3', name: 'Health', slug: 'health', description: 'Health tips, wellness, and medical news', color: '#22c55e', icon: 'health', enabled: true, contentTypes: ['news', 'guide', 'listicle'], order: 2 },
    { id: '4', name: 'Finance', slug: 'finance', description: 'Financial news, investing, and money tips', color: '#f97316', icon: 'finance', enabled: true, contentTypes: ['news', 'analysis', 'guide'], order: 3 },
    { id: '5', name: 'Sports', slug: 'sports', description: 'Sports news, scores, and highlights', color: '#ef4444', icon: 'sports', enabled: true, contentTypes: ['news', 'analysis'], order: 4 },
    { id: '6', name: 'Lifestyle', slug: 'lifestyle', description: 'Lifestyle, trends, and living tips', color: '#ec4899', icon: 'lifestyle', enabled: true, contentTypes: ['guide', 'listicle', 'review'], order: 5 },
    { id: '7', name: 'Entertainment', slug: 'entertainment', description: 'Movies, music, and celebrity news', color: '#6366f1', icon: 'entertainment', enabled: true, contentTypes: ['news', 'review', 'interview'], order: 6 },
    { id: '8', name: 'Recipes', slug: 'recipes', description: 'Delicious recipes and cooking guides', color: '#f59e0b', icon: 'recipes', enabled: false, contentTypes: ['recipe', 'guide', 'listicle'], order: 7 },
    { id: '9', name: 'Relationships', slug: 'relationships', description: 'Dating, relationships, and advice', color: '#ec4899', icon: 'relationships', enabled: false, contentTypes: ['guide', 'analysis', 'listicle'], order: 8 },
    { id: '10', name: 'Travel', slug: 'travel', description: 'Travel guides, destinations, and tips', color: '#06b6d4', icon: 'travel', enabled: false, contentTypes: ['guide', 'listicle', 'review'], order: 9 },
  ];
}

/**
 * Get default settings from environment variables
 * These are used to seed the database on first run
 */
function getDefaultSettings() {
  return {
    // Brand settings
    name: process.env.BRAND_NAME || 'News Portal',
    logoUrl: process.env.BRAND_LOGO_URL || '/images/logo.png',
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
    
    // Categories - default content categories
    categories: getDefaultCategories(),
    
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
