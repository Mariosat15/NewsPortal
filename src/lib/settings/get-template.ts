import { getBrandId } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';

export interface TemplateSettings {
  layout: 'magazine' | 'minimal' | 'grid' | 'classic' | 'dark-pro' | 'dark-portal';
  colorScheme: 'pink' | 'blue' | 'red' | 'green' | 'purple' | 'orange';
  darkMode: boolean;
}

const defaultSettings: TemplateSettings = {
  layout: 'magazine',
  colorScheme: 'pink',
  darkMode: false,
};

export const colorSchemes: Record<string, { primary: string; secondary: string }> = {
  pink: { primary: '#e91e8c', secondary: '#d11a7d' },
  blue: { primary: '#2563eb', secondary: '#1d4ed8' },
  red: { primary: '#dc2626', secondary: '#b91c1c' },
  green: { primary: '#16a34a', secondary: '#15803d' },
  purple: { primary: '#9333ea', secondary: '#7e22ce' },
  orange: { primary: '#ea580c', secondary: '#c2410c' },
};

export async function getTemplateSettings(): Promise<TemplateSettings> {
  try {
    const brandId = await getBrandId();
    const collection = await getCollection(brandId, 'settings');
    
    const templateDoc = await collection.findOne({ key: 'template' });
    
    if (templateDoc?.value) {
      const saved = templateDoc.value as Partial<TemplateSettings>;
      return {
        layout: saved.layout || defaultSettings.layout,
        colorScheme: saved.colorScheme || defaultSettings.colorScheme,
        darkMode: saved.darkMode ?? defaultSettings.darkMode,
      };
    }
    
    return defaultSettings;
  } catch (error) {
    console.error('Error fetching template settings:', error);
    return defaultSettings;
  }
}
