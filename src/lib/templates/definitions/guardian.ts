import { TemplateDefinition } from '../types';

export const guardianTemplate: TemplateDefinition = {
  id: 'guardian',
  name: 'Guardian',
  description: 'Classic editorial newspaper style with sophisticated typography',
  preview: '/templates/guardian-preview.png',
  category: 'editorial',
  
  layout: {
    header: 'standard',
    navigation: 'horizontal',
    homepage: 'editorial',
    categoryPage: 'featured-grid',
    articleCard: 'overlay',
  },
  
  typography: {
    headingFont: 'var(--font-merriweather), Georgia, serif',
    bodyFont: 'var(--font-merriweather), Georgia, serif',
    headingWeight: 700,
    scale: 'normal',
  },
  
  colors: {
    light: {
      primary: '#052962',
      secondary: '#1a73e8',
      accent: '#c70000',
      background: '#f6f6f6',
      surface: '#ffffff',
      surfaceAlt: '#f1f1f1',
      text: '#121212',
      textMuted: '#707070',
      border: '#dcdcdc',
      success: '#22874d',
      warning: '#ff7800',
      error: '#c70000',
    },
    dark: {
      primary: '#90caf9',
      secondary: '#64b5f6',
      accent: '#ff6b6b',
      background: '#1a1a1a',
      surface: '#262626',
      surfaceAlt: '#333333',
      text: '#ffffff',
      textMuted: '#999999',
      border: '#404040',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
    },
  },
  
  features: {
    darkMode: true,
    animations: true,
    roundedCorners: 'sm',
    shadows: 'subtle',
    stickyHeader: true,
    showBreadcrumbs: true,
    showReadingTime: true,
    showAuthor: true,
    categoryBadges: true,
  },
  
  spacing: {
    containerMax: '1300px',
    sectionGap: '2rem',
    cardGap: '1.25rem',
    headerHeight: '64px',
  },
};
