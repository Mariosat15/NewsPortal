import { TemplateDefinition } from '../types';

export const bloombergTemplate: TemplateDefinition = {
  id: 'bloomberg',
  name: 'Bloomberg',
  description: 'Professional financial news style with data-driven layouts and market focus',
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
      surface: '#f7f7f7',
      surfaceAlt: '#eeeeee',
      text: '#1a1a1a',
      textMuted: '#666666',
      border: '#e0e0e0',
      success: '#00a650',
      warning: '#ff9500',
      error: '#ff3b30',
    },
    dark: {
      primary: '#ffffff',
      secondary: '#cccccc',
      accent: '#ff6600',
      background: '#121212',
      surface: '#1e1e1e',
      surfaceAlt: '#2a2a2a',
      text: '#ffffff',
      textMuted: '#999999',
      border: '#333333',
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
    containerMax: '1400px',
    sectionGap: '2rem',
    cardGap: '1rem',
    headerHeight: '56px',
  },
};
