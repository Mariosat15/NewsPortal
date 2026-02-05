import { TemplateDefinition } from '../types';

export const cnnTemplate: TemplateDefinition = {
  id: 'cnn',
  name: 'CNN',
  description: 'Breaking news focused with urgent visual cues and live updates style',
  preview: '/templates/cnn-preview.png',
  category: 'news',
  
  layout: {
    header: 'mega',
    navigation: 'mega-menu',
    homepage: 'magazine',
    categoryPage: 'featured-grid',
    articleCard: 'compact',
  },
  
  typography: {
    headingFont: 'var(--font-inter), system-ui, sans-serif',
    bodyFont: 'var(--font-inter), system-ui, sans-serif',
    headingWeight: 700,
    scale: 'normal',
  },
  
  colors: {
    light: {
      primary: '#cc0000',
      secondary: '#001e36',
      accent: '#cc0000',
      background: '#ffffff',
      surface: '#f4f4f4',
      surfaceAlt: '#eaeaea',
      text: '#0c0c0c',
      textMuted: '#5f5f5f',
      border: '#d9d9d9',
      success: '#0f9d58',
      warning: '#f9a825',
      error: '#cc0000',
    },
    dark: {
      primary: '#ff4444',
      secondary: '#90cdf4',
      accent: '#ff4444',
      background: '#0c0c0c',
      surface: '#1a1a1a',
      surfaceAlt: '#262626',
      text: '#ffffff',
      textMuted: '#a0a0a0',
      border: '#3d3d3d',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#ff4444',
    },
  },
  
  features: {
    darkMode: true,
    animations: true,
    roundedCorners: 'sm',
    shadows: 'subtle',
    stickyHeader: true,
    showBreadcrumbs: true,
    showReadingTime: false,
    showAuthor: true,
    categoryBadges: true,
  },
  
  spacing: {
    containerMax: '1280px',
    sectionGap: '1.5rem',
    cardGap: '1rem',
    headerHeight: '60px',
  },
};
