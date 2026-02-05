// Server-side template utilities - safe to use in server components

import { ResolvedTemplate, TemplateColors, TemplateDefinition } from './types';
import { getTemplateById, DEFAULT_TEMPLATE_ID } from './index';

function generateCssVariables(colors: TemplateColors, template: TemplateDefinition): Record<string, string> {
  const vars: Record<string, string> = {
    // Colors
    '--template-primary': colors.primary,
    '--template-secondary': colors.secondary,
    '--template-accent': colors.accent,
    '--template-background': colors.background,
    '--template-surface': colors.surface,
    '--template-surface-alt': colors.surfaceAlt,
    '--template-text': colors.text,
    '--template-text-muted': colors.textMuted,
    '--template-border': colors.border,
    '--template-success': colors.success,
    '--template-warning': colors.warning,
    '--template-error': colors.error,
    
    // Typography
    '--template-heading-font': template.typography.headingFont,
    '--template-body-font': template.typography.bodyFont,
    '--template-heading-weight': String(template.typography.headingWeight),
    
    // Spacing
    '--template-container-max': template.spacing.containerMax,
    '--template-section-gap': template.spacing.sectionGap,
    '--template-card-gap': template.spacing.cardGap,
    '--template-header-height': template.spacing.headerHeight,
    
    // Features
    '--template-radius': getRadiusValue(template.features.roundedCorners),
    '--template-shadow': getShadowValue(template.features.shadows),
  };
  
  return vars;
}

function getRadiusValue(radius: string): string {
  const map: Record<string, string> = {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    full: '9999px',
  };
  return map[radius] || '0.5rem';
}

function getShadowValue(shadow: string): string {
  const map: Record<string, string> = {
    none: 'none',
    subtle: '0 1px 3px rgba(0,0,0,0.08)',
    medium: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    strong: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
  };
  return map[shadow] || 'none';
}

// Server-side template resolution
export function resolveTemplate(
  templateId: string,
  colorMode: 'light' | 'dark' = 'light',
  customColors?: Partial<TemplateColors>
): ResolvedTemplate {
  const template = getTemplateById(templateId);
  const baseColors = colorMode === 'dark' ? template.colors.dark : template.colors.light;
  const activeColors = customColors ? { ...baseColors, ...customColors } : baseColors;
  const cssVariables = generateCssVariables(activeColors, template);
  
  return {
    ...template,
    activeColors,
    cssVariables,
  };
}
