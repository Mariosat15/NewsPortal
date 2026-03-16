import { TemplateDefinition } from '../types';

export const bloombergTemplate: TemplateDefinition = {
  id: 'bloomberg',
  name: 'Bloomberg',
  description: 'Premium financial intelligence platform design with data-dense layouts, market-ticker aesthetics, and razor-sharp typography. Built for readers who value speed and information density over white space.',
  preview: '/templates/bloomberg-preview.png',
  category: 'financial',
  
  layout: {
    header: 'sticky-compact',
    navigation: 'horizontal',
    homepage: 'grid',
    categoryPage: 'grid',
    articleCard: 'horizontal',
  },
  
  typography: {
    headingFont: 'var(--font-inter), system-ui, sans-serif',
    bodyFont: 'var(--font-inter), system-ui, sans-serif',
    headingWeight: 600,
    scale: 'compact',
  },
  
  colors: {
    light: {
      primary: '#1a1a1a',
      secondary: '#404040',
      accent: '#ff6600',
      background: '#ffffff',
      surface: '#fafafa',
      surfaceAlt: '#f0f0f0',
      text: '#1a1a1a',
      textMuted: '#5c5c5c',
      border: '#e4e4e7',
      success: '#00a650',
      warning: '#ff9500',
      error: '#ff3b30',
    },
    dark: {
      primary: '#ffffff',
      secondary: '#d4d4d8',
      accent: '#ff8c42',
      background: '#09090b',
      surface: '#18181b',
      surfaceAlt: '#27272a',
      text: '#fafafa',
      textMuted: '#a1a1aa',
      border: '#3f3f46',
      success: '#30d158',
      warning: '#ff9f0a',
      error: '#ff453a',
    },
  },
  
  features: {
    darkMode: true,
    animations: false,
    roundedCorners: 'none',
    shadows: 'subtle',
    stickyHeader: true,
    showBreadcrumbs: false,
    showReadingTime: true,
    showAuthor: false,
    categoryBadges: true,
  },
  
  spacing: {
    containerMax: '1440px',
    sectionGap: '2.5rem',
    cardGap: '1rem',
    headerHeight: '48px',
  },
};
