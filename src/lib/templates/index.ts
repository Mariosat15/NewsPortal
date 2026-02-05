// Template Registry - Central hub for all template definitions

import { TemplateDefinition } from './types';

// Import all template definitions
import { bloombergTemplate } from './definitions/bloomberg';
import { guardianTemplate } from './definitions/guardian';
import { vergeTemplate } from './definitions/verge';
import { mediumTemplate } from './definitions/medium';
import { cnnTemplate } from './definitions/cnn';
import { voxTemplate } from './definitions/vox';
import { wiredTemplate } from './definitions/wired';
import { economistTemplate } from './definitions/economist';
import { techcrunchTemplate } from './definitions/techcrunch';
import { slateTemplate } from './definitions/slate';
import { axiosTemplate } from './definitions/axios';
import { viceTemplate } from './definitions/vice';

export const DEFAULT_TEMPLATE_ID = 'guardian';

// Template registry
const templates: Map<string, TemplateDefinition> = new Map([
  ['bloomberg', bloombergTemplate],
  ['guardian', guardianTemplate],
  ['verge', vergeTemplate],
  ['medium', mediumTemplate],
  ['cnn', cnnTemplate],
  ['vox', voxTemplate],
  ['wired', wiredTemplate],
  ['economist', economistTemplate],
  ['techcrunch', techcrunchTemplate],
  ['slate', slateTemplate],
  ['axios', axiosTemplate],
  ['vice', viceTemplate],
]);

export function getTemplateById(id: string): TemplateDefinition {
  const template = templates.get(id);
  if (!template) {
    console.warn(`Template "${id}" not found, using default "${DEFAULT_TEMPLATE_ID}"`);
    return templates.get(DEFAULT_TEMPLATE_ID)!;
  }
  return template;
}

export function getAllTemplates(): TemplateDefinition[] {
  return Array.from(templates.values());
}

export function getTemplatesByCategory(category: TemplateDefinition['category']): TemplateDefinition[] {
  return Array.from(templates.values()).filter(t => t.category === category);
}

export function getTemplateIds(): string[] {
  return Array.from(templates.keys());
}

// Re-export types and utilities
export * from './types';
export * from './context';
export * from './utils';
