import { TemplateDefinition } from '../types';

export const axiosTemplate: TemplateDefinition = {
  id: 'axios',
  name: 'Axios',
  description: 'Ultra-minimal brief news format with quick-read bullet points',
  preview: '/templates/axios-preview.png',
  category: 'minimal',
  
  layout: {
    header: 'minimal',
    navigation: 'horizontal',
    homepage: 'minimal',
    categoryPage: 'timeline',
    articleCard: 'compact',
  },
  
  typography: {
    headingFont: '"IBM Plex Sans", "Roboto", sans-serif',
    bodyFont: '"IBM Plex Sans", "Roboto", sans-serif',
    headingWeight: 600,
    scale: 'compact',
  },
  
  colors: {
    light: {
      primary: '#333f51',
      secondary: '#546e7a',
      accent: '#2564eb',
      background: '#ffffff',
      surface: '#f8f9fa',
      surfaceAlt: '#f1f3f4',
      text: '#333f51',
      textMuted: '#637381',
      border: '#e4e7ec',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    dark: {
      primary: '#ffffff',
      secondary: '#cfd8dc',
      accent: '#60a5fa',
      background: '#0f1419',
      surface: '#1a2027',
      surfaceAlt: '#252d35',
      text: '#ffffff',
      textMuted: '#8b949e',
      border: '#30363d',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
    },
  },
  
  features: {
    darkMode: true,
    animations: false,
    roundedCorners: 'md',
    shadows: 'none',
    stickyHeader: true,
    showBreadcrumbs: false,
    showReadingTime: false,
    showAuthor: false,
    categoryBadges: false,
  },
  
  spacing: {
    containerMax: '680px',
    sectionGap: '1.5rem',
    cardGap: '1rem',
    headerHeight: '52px',
  },
};
