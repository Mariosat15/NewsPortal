'use client';

import { ReactNode, useEffect, useState } from 'react';
import { TemplateProvider, getTemplateById, DEFAULT_TEMPLATE_ID, ResolvedTemplate, TemplateColors } from '@/lib/templates';
import { getHeaderComponent } from './headers';
import { CategoryConfig } from '@/lib/templates/types';

interface TemplateWrapperProps {
  children: ReactNode;
  templateId?: string;
  colorMode?: 'light' | 'dark' | 'system';
  customPrimary?: string | null;
  categories: CategoryConfig[];
  locale: string;
  brandName: string;
  logoUrl?: string;
}

export function TemplateWrapper({ 
  children, 
  templateId = DEFAULT_TEMPLATE_ID,
  colorMode = 'light',
  customPrimary,
  categories,
  locale,
  brandName,
  logoUrl,
}: TemplateWrapperProps) {
  const [resolvedColorMode, setResolvedColorMode] = useState<'light' | 'dark'>(
    colorMode === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    if (colorMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedColorMode(mediaQuery.matches ? 'dark' : 'light');
      
      const handler = (e: MediaQueryListEvent) => setResolvedColorMode(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setResolvedColorMode(colorMode === 'dark' ? 'dark' : 'light');
    }
  }, [colorMode]);

  // Build custom colors if primary override is set
  const customColors: Partial<TemplateColors> | undefined = customPrimary 
    ? { primary: customPrimary, accent: customPrimary }
    : undefined;

  return (
    <TemplateProvider 
      templateId={templateId} 
      colorMode={resolvedColorMode}
      customColors={customColors}
    >
      <TemplateContent
        categories={categories}
        locale={locale}
        brandName={brandName}
        logoUrl={logoUrl}
      >
        {children}
      </TemplateContent>
    </TemplateProvider>
  );
}

interface TemplateContentProps {
  children: ReactNode;
  categories: CategoryConfig[];
  locale: string;
  brandName: string;
  logoUrl?: string;
}

function TemplateContent({ children, categories, locale, brandName, logoUrl }: TemplateContentProps) {
  // Get the current template from context
  const [template, setTemplate] = useState<ResolvedTemplate | null>(null);
  
  useEffect(() => {
    // Get template from context (simple approach)
    const templateElement = document.querySelector('[class*="template-"]');
    if (templateElement) {
      const templateClass = Array.from(templateElement.classList).find(c => c.startsWith('template-'));
      if (templateClass) {
        const templateId = templateClass.replace('template-', '');
        const templateDef = getTemplateById(templateId);
        if (templateDef) {
          // Create resolved template
          const isDark = templateElement.classList.contains('dark');
          const activeColors = isDark ? templateDef.colors.dark : templateDef.colors.light;
          setTemplate({
            ...templateDef,
            activeColors,
            cssVariables: {},
          } as ResolvedTemplate);
        }
      }
    }
  }, []);

  if (!template) {
    // Fallback - render without template-specific header
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  const HeaderComponent = getHeaderComponent(template.layout.header);

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: template.activeColors.background }}
    >
      {/* Template Header */}
      <HeaderComponent
        template={template}
        categories={categories}
        locale={locale}
        brandName={brandName}
        logoUrl={logoUrl}
      />
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer would go here - using template colors */}
      <footer 
        className="border-t"
        style={{ 
          backgroundColor: template.activeColors.surface,
          borderColor: template.activeColors.border,
        }}
      >
        <div 
          className="mx-auto px-4 py-8"
          style={{ maxWidth: template.spacing.containerMax }}
        >
          <div 
            className="text-sm text-center"
            style={{ color: template.activeColors.textMuted }}
          >
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default TemplateWrapper;
