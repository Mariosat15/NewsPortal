import { NextRequest, NextResponse } from 'next/server';
import { getBrandIdSync, clearSettingsCache } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { seedDefaultSettings } from '@/lib/db/seed';
import { verifyAdmin } from '@/lib/auth/admin';

interface Settings {
  key: string;
  value: unknown;
  updatedAt: Date;
}

// GET /api/admin/settings - Get all settings
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = getBrandIdSync();
    
    // Seed default settings on first run (ensures DB is initialized)
    await seedDefaultSettings(brandId);
    
    const collection = await getCollection<Settings>(brandId, 'settings');
    
    const settingsArray = await collection.find({}).toArray();
    const settings: Record<string, unknown> = {};
    
    for (const setting of settingsArray) {
      settings[setting.key] = setting.value;
    }

    // Merge with env-based defaults (all configurable options)
    const envSettings = {
      // Brand
      id: process.env.BRAND_ID || 'brand1',
      name: process.env.BRAND_NAME || 'News Portal',
      domain: process.env.BRAND_DOMAIN || 'localhost:3000',
      logoUrl: process.env.BRAND_LOGO_URL || '/images/logo.png',
      faviconUrl: process.env.BRAND_FAVICON_URL || '/favicon.svg',
      primaryColor: process.env.BRAND_PRIMARY_COLOR?.trim() || '#1a73e8',
      secondaryColor: process.env.BRAND_SECONDARY_COLOR?.trim() || '#4285f4',
      
      // Pricing
      pricing: {
        enabled: process.env.PRICING_ENABLED !== 'false', // Default enabled
        articlePriceCents: parseInt(process.env.ARTICLE_PRICE_CENTS || '99', 10),
        currency: process.env.PRICING_CURRENCY || 'EUR',
      },
      
      // DIMOCO Payment
      dimoco: {
        apiUrl: process.env.DIMOCO_API_URL || 'https://api.dimoco.eu',
        apiKey: process.env.DIMOCO_API_KEY || '',
        merchantId: process.env.DIMOCO_MERCHANT_ID || '',
        serviceId: process.env.DIMOCO_SERVICE_ID || '',
        callbackSecret: process.env.DIMOCO_CALLBACK_SECRET || '',
        successUrl: process.env.DIMOCO_SUCCESS_URL || '/payment/success',
        cancelUrl: process.env.DIMOCO_CANCEL_URL || '/payment/cancel',
      },
      
      // OpenAI
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
      },
      
      // BrightData
      brightdata: {
        apiToken: process.env.BRIGHTDATA_API_TOKEN || '',
        zone: process.env.BRIGHTDATA_ZONE || 'web_unlocker1',
      },
      
      // Admin
      admin: {
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: '', // Don't expose actual password, just show empty
      },
      
      // Database
      database: {
        uri: process.env.MONGODB_URI ? '***configured***' : '', // Don't expose full URI
      },
      
      // Agents
      agentConfig: {
        cronSchedule: process.env.AGENT_CRON_SCHEDULE || '0 */6 * * *',
        maxArticlesPerRun: parseInt(process.env.AGENT_MAX_ARTICLES_PER_RUN || '5', 10),
        defaultTopics: (process.env.AGENT_DEFAULT_TOPICS || 'news,lifestyle,technology,sports,health,finance').split(','),
        defaultLanguage: process.env.AGENT_DEFAULT_LANGUAGE || 'de',
      },
    };

    return NextResponse.json({
      success: true,
      settings: { ...envSettings, ...settings },
    });
  } catch (error) {
    console.error('Admin settings GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings - Update settings
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = getBrandIdSync();
    const collection = await getCollection<Settings>(brandId, 'settings');
    const body = await request.json();

    // Store each top-level setting as a separate document for flexibility
    const updates = [];
    
    for (const [key, value] of Object.entries(body)) {
      if (key === 'id') continue; // Skip the brand ID - it's read-only
      
      updates.push(
        collection.updateOne(
          { key },
          { 
            $set: { 
              key, 
              value, 
              updatedAt: new Date() 
            } 
          },
          { upsert: true }
        )
      );
    }

    await Promise.all(updates);

    // Clear the settings cache so new values are loaded
    clearSettingsCache();

    return NextResponse.json({
      success: true,
      message: 'Settings saved to database successfully',
    });
  } catch (error) {
    console.error('Admin settings POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
