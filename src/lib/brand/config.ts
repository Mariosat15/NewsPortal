export interface BrandConfig {
  id: string;
  name: string;
  domain: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  impressum: {
    companyName: string;
    address: string;
    email: string;
    phone?: string;
    vatId?: string;
    registerNumber?: string;
  };
  footer: {
    hilfeUrl: string;
    kundenportalUrl: string;
    widerrufsbelehrungUrl: string;
    impressumUrl: string;
    kuendigungUrl: string;
    agbUrl: string;
    datenschutzUrl: string;
  };
  socialSharing: {
    enabled: boolean;
    platforms: ('whatsapp' | 'facebook' | 'twitter' | 'copylink')[];
  };
  features: {
    bookmarks: boolean;
    favorites: boolean;
    trending: boolean;
  };
  agentConfig: {
    enabled: boolean;
    topics: string[];
    cronSchedule: string;
    maxArticlesPerRun: number;
    defaultLanguage: 'de' | 'en';
    // Extended settings (loaded from database when available)
    rssFeeds?: { url: string; name: string; category: string; language: 'de' | 'en'; enabled: boolean }[];
    useRSSFeeds?: boolean;
    aiModel?: {
      model: string;
      temperature: number;
      maxTokens: number;
      topP: number;
      frequencyPenalty: number;
      presencePenalty: number;
    };
    articleStyle?: {
      types: ('news' | 'analysis' | 'opinion' | 'summary' | 'investigative' | 'guide' | 'recipe' | 'review' | 'listicle' | 'profile')[];
      tone: 'neutral' | 'engaging' | 'formal' | 'conversational';
      depth: 'brief' | 'standard' | 'in-depth';
      includeImages: boolean;
      includeQuotes: boolean;
      includeSources: boolean;
    };
    minWordCount?: number;
    maxWordCount?: number;
    minQualityScore?: number;
    distributeEvenly?: boolean;
  };
}

// Default brand configuration (used as fallback)
export const defaultBrandConfig: BrandConfig = {
  id: 'default',
  name: 'News Portal',
  domain: 'localhost:3000',
  logoUrl: '/images/logo.png',
  primaryColor: '#1a73e8',
  secondaryColor: '#4285f4',
  impressum: {
    companyName: 'News Portal GmbH',
    address: 'Musterstraße 1, 10115 Berlin, Germany',
    email: 'kontakt@newsportal.de',
    phone: '+49 30 12345678',
  },
  footer: {
    hilfeUrl: '/de/legal/hilfe',
    kundenportalUrl: '/de/legal/kundenportal',
    widerrufsbelehrungUrl: '/de/legal/widerrufsbelehrung',
    impressumUrl: '/de/legal/impressum',
    kuendigungUrl: '/de/legal/kuendigung',
    agbUrl: '/de/legal/agb',
    datenschutzUrl: '/de/legal/datenschutz',
  },
  socialSharing: {
    enabled: true,
    platforms: ['whatsapp', 'facebook', 'twitter', 'copylink'],
  },
  features: {
    bookmarks: true,
    favorites: true,
    trending: true,
  },
  agentConfig: {
    enabled: true,
    topics: ['news', 'lifestyle', 'technology', 'sports', 'health', 'finance'],
    cronSchedule: '0 */6 * * *',
    maxArticlesPerRun: 5,
    defaultLanguage: 'de',
  },
};

// Get brand config from environment variables
export function getBrandConfigFromEnv(): BrandConfig {
  const config: BrandConfig = {
    ...defaultBrandConfig,
    id: process.env.BRAND_ID || defaultBrandConfig.id,
    name: process.env.BRAND_NAME || defaultBrandConfig.name,
    domain: process.env.BRAND_DOMAIN || defaultBrandConfig.domain,
    logoUrl: process.env.BRAND_LOGO_URL || defaultBrandConfig.logoUrl,
    primaryColor: process.env.BRAND_PRIMARY_COLOR || defaultBrandConfig.primaryColor,
    secondaryColor: process.env.BRAND_SECONDARY_COLOR || defaultBrandConfig.secondaryColor,
  };

  // Parse agent config from env
  if (process.env.AGENT_DEFAULT_TOPICS) {
    config.agentConfig.topics = process.env.AGENT_DEFAULT_TOPICS.split(',').map(t => t.trim());
  }
  if (process.env.AGENT_CRON_SCHEDULE) {
    config.agentConfig.cronSchedule = process.env.AGENT_CRON_SCHEDULE;
  }
  if (process.env.AGENT_MAX_ARTICLES_PER_RUN) {
    config.agentConfig.maxArticlesPerRun = parseInt(process.env.AGENT_MAX_ARTICLES_PER_RUN, 10);
  }

  return config;
}

// Domain to brand ID mapping (can be extended from database or config file)
// Note: localhost uses BRAND_ID from env, production domains can be mapped here
const domainToBrandMap: Record<string, string> = {
  // Add production domain mappings here, e.g.:
  // 'news.example.com': 'brand1',
  // 'other-news.com': 'brand2',
};

// Get brand ID from domain
export function getBrandIdFromDomain(domain: string): string {
  // Remove port if present for matching
  const domainWithoutPort = domain.split(':')[0];
  
  // Try exact match first
  if (domainToBrandMap[domain]) {
    return domainToBrandMap[domain];
  }
  
  // Try without port
  if (domainToBrandMap[domainWithoutPort]) {
    return domainToBrandMap[domainWithoutPort];
  }
  
  // Always use BRAND_ID from env for localhost or when no mapping exists
  return process.env.BRAND_ID || 'brand1';
}

// Get brand config (sync version - uses env vars only, for client-side usage)
export function getBrandConfig(brandId?: string): BrandConfig {
  const config = getBrandConfigFromEnv();
  
  if (brandId && brandId !== config.id) {
    // Return modified config with different brandId
    return { ...config, id: brandId };
  }
  
  return config;
}

// CSS custom properties for brand theming
export function getBrandCSSVariables(config: BrandConfig): string {
  return `
    --brand-primary: ${config.primaryColor};
    --brand-secondary: ${config.secondaryColor};
  `;
}
