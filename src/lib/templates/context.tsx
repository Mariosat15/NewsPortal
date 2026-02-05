'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { ResolvedTemplate, TemplateColors, TemplateDefinition } from './types';
import { getTemplateById, DEFAULT_TEMPLATE_ID } from './index';

interface TemplateContextValue {
  template: ResolvedTemplate;
  isDark: boolean;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);

export function useTemplate(): TemplateContextValue {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  return context;
}

export function useTemplateColors(): TemplateColors {
  const { template } = useTemplate();
  return template.activeColors;
}

interface TemplateProviderProps {
  children: React.ReactNode;
  templateId?: string;
  colorMode?: 'light' | 'dark' | 'system';
  customColors?: Partial<TemplateColors>;
}

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

export function TemplateProvider({ 
  children, 
  templateId = DEFAULT_TEMPLATE_ID,
  colorMode = 'light',
  customColors,
}: TemplateProviderProps) {
  const value = useMemo(() => {
    const template = getTemplateById(templateId);
    const isDark = colorMode === 'dark';
    const baseColors = isDark ? template.colors.dark : template.colors.light;
    const activeColors = customColors ? { ...baseColors, ...customColors } : baseColors;
    const cssVariables = generateCssVariables(activeColors, template);
    
    const resolvedTemplate: ResolvedTemplate = {
      ...template,
      activeColors,
      cssVariables,
    };
    
    return { template: resolvedTemplate, isDark };
  }, [templateId, colorMode, customColors]);

  // Apply CSS variables to document
  const style = useMemo(() => {
    return Object.entries(value.template.cssVariables)
      .map(([key, val]) => `${key}: ${val}`)
      .join('; ');
  }, [value.template.cssVariables]);

  return (
    <TemplateContext.Provider value={value}>
      <div 
        style={{ cssText: style } as React.CSSProperties}
        className={`template-${value.template.id} ${value.isDark ? 'dark' : 'light'}`}
      >
        {children}
      </div>
    </TemplateContext.Provider>
  );
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
