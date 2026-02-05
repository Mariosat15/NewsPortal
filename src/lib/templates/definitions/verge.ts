import { TemplateDefinition } from '../types';

export const vergeTemplate: TemplateDefinition = {
  id: 'verge',
  name: 'Verge',
  description: 'Bold tech-focused design with colorful accents and modern typography',
  preview: '/templates/verge-preview.png',
  category: 'tech',
  
  layout: {
    header: 'split',
    navigation: 'tabbed',
    homepage: 'masonry',
    categoryPage: 'masonry',
    articleCard: 'overlay',
  },
  
  typography: {
    headingFont: 'var(--font-space-grotesk), system-ui, sans-serif',
    bodyFont: 'var(--font-inter), system-ui, sans-serif',
    headingWeight: 800,
    scale: 'spacious',
  },
  
  colors: {
    light: {
      primary: '#000000',
      secondary: '#3b3b3b',
      accent: '#fa4b35',
      background: '#ffffff',
      surface: '#f9f9f9',
      surfaceAlt: '#f0f0f0',
      text: '#000000',
      textMuted: '#6b6b6b',
      border: '#e5e5e5',
      success: '#00b87c',
      warning: '#ffb800',
      error: '#fa4b35',
    },
    dark: {
      primary: '#ffffff',
      secondary: '#e0e0e0',
      accent: '#ff6b5b',
      background: '#000000',
      surface: '#141414',
      surfaceAlt: '#1f1f1f',
      text: '#ffffff',
      textMuted: '#a0a0a0',
      border: '#333333',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#ff6b5b',
    },
  },
  
  features: {
    darkMode: true,
    animations: true,
    roundedCorners: 'lg',
    shadows: 'medium',
    stickyHeader: true,
    showBreadcrumbs: false,
    showReadingTime: true,
    showAuthor: true,
    categoryBadges: true,
  },
  
  spacing: {
    containerMax: '1400px',
    sectionGap: '2.5rem',
    cardGap: '1.5rem',
    headerHeight: '72px',
  },
};
