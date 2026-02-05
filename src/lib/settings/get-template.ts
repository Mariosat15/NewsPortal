import { getBrandId } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';

// Legacy template settings (backward compatible)
export interface TemplateSettings {
  layout: 'magazine' | 'minimal' | 'grid' | 'classic' | 'dark-pro' | 'dark-portal';
  colorScheme: 'pink' | 'blue' | 'red' | 'green' | 'purple' | 'orange';
  darkMode: boolean;
}

// New template settings
export interface NewTemplateSettings {
  templateId: string;  // New template ID from the template registry (e.g., 'guardian', 'bloomberg')
  colorMode: 'light' | 'dark' | 'system';
  colorPreset: string;
  customPrimary?: string | null;
}

const defaultSettings: TemplateSettings = {
  layout: 'magazine',
  colorScheme: 'pink',
  darkMode: false,
};

const defaultNewSettings: NewTemplateSettings = {
  templateId: 'guardian',  // Default to Guardian template
  colorMode: 'light',
  colorPreset: 'default',
  customPrimary: null,
};

export const colorSchemes: Record<string, { primary: string; secondary: string }> = {
  pink: { primary: '#e91e8c', secondary: '#d11a7d' },
  blue: { primary: '#2563eb', secondary: '#1d4ed8' },
  red: { primary: '#dc2626', secondary: '#b91c1c' },
  green: { primary: '#16a34a', secondary: '#15803d' },
  purple: { primary: '#9333ea', secondary: '#7e22ce' },
  orange: { primary: '#ea580c', secondary: '#c2410c' },
  teal: { primary: '#14b8a6', secondary: '#0d9488' },
};

// New template IDs from the professional template system
const newTemplateIds = [
  'bloomberg', 'guardian', 'verge', 'medium', 'cnn', 'vox',
  'wired', 'economist', 'techcrunch', 'slate', 'axios', 'vice'
];

// Check if a template ID is from the new system
export function isNewTemplate(templateId: string): boolean {
  return newTemplateIds.includes(templateId);
}

// Legacy function for backward compatibility
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

// New function for the professional template system
export async function getNewTemplateSettings(): Promise<NewTemplateSettings> {
  try {
    const brandId = await getBrandId();
    const collection = await getCollection(brandId, 'settings');
    
    const templateDoc = await collection.findOne({ key: 'template' });
    
    if (templateDoc?.value) {
      const saved = templateDoc.value as Record<string, unknown>;
      
      // Check if using new template system
      if (saved.templateId && typeof saved.templateId === 'string') {
        return {
          templateId: saved.templateId,
          colorMode: (saved.colorMode as NewTemplateSettings['colorMode']) || defaultNewSettings.colorMode,
          colorPreset: (saved.colorPreset as string) || defaultNewSettings.colorPreset,
          customPrimary: (saved.customPrimary as string | null) || null,
        };
      }
      
      // Fallback: Map legacy settings to new system
      const legacyLayout = saved.layout as string;
      let templateId = 'guardian';
      
      // Map legacy layouts to new template IDs
      const legacyMapping: Record<string, string> = {
        'magazine': 'guardian',
        'minimal': 'medium',
        'grid': 'verge',
        'classic': 'economist',
        'dark-pro': 'bloomberg',
        'dark-portal': 'cnn',
      };
      
      if (legacyLayout && legacyMapping[legacyLayout]) {
        templateId = legacyMapping[legacyLayout];
      }
      
      return {
        templateId,
        colorMode: saved.darkMode ? 'dark' : 'light',
        colorPreset: (saved.colorScheme as string) || 'default',
        customPrimary: null,
      };
    }
    
    return defaultNewSettings;
  } catch (error) {
    console.error('Error fetching new template settings:', error);
    return defaultNewSettings;
  }
}

// Get the appropriate primary color based on settings
export function getPrimaryColor(settings: NewTemplateSettings): string | null {
  if (settings.customPrimary) {
    return settings.customPrimary;
  }
  if (settings.colorPreset !== 'default' && colorSchemes[settings.colorPreset]) {
    return colorSchemes[settings.colorPreset].primary;
  }
  return null;
}
