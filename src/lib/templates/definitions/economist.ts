import { TemplateDefinition } from '../types';

export const economistTemplate: TemplateDefinition = {
  id: 'economist',
  name: 'Economist',
  description: 'Traditional business newspaper style with classic masthead design',
  preview: '/templates/economist-preview.png',
  category: 'financial',
  
  layout: {
    header: 'standard',
    navigation: 'horizontal',
    homepage: 'editorial',
    categoryPage: 'list',
    articleCard: 'horizontal',
  },
  
  typography: {
    headingFont: 'var(--font-playfair), Georgia, serif',
    bodyFont: 'var(--font-source-serif), Georgia, serif',
    headingWeight: 700,
    scale: 'normal',
  },
  
  colors: {
    light: {
      primary: '#e3120b',
      secondary: '#1d3557',
      accent: '#e3120b',
      background: '#f5f1eb',
      surface: '#ffffff',
      surfaceAlt: '#faf7f2',
      text: '#1d1d1b',
      textMuted: '#63605b',
      border: '#d9d5cd',
      success: '#2e7d32',
      warning: '#ed6c02',
      error: '#e3120b',
    },
    dark: {
      primary: '#ff5252',
      secondary: '#90caf9',
      accent: '#ff5252',
      background: '#1a1917',
      surface: '#252422',
      surfaceAlt: '#302e2b',
      text: '#f5f1eb',
      textMuted: '#a09a90',
      border: '#3d3a35',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#ff5252',
    },
  },
  
  features: {
    darkMode: true,
    animations: false,
    roundedCorners: 'none',
    shadows: 'subtle',
    stickyHeader: false,
    showBreadcrumbs: true,
    showReadingTime: true,
    showAuthor: false,
    categoryBadges: true,
  },
  
  spacing: {
    containerMax: '1180px',
    sectionGap: '2rem',
    cardGap: '1.5rem',
    headerHeight: '80px',
  },
};
