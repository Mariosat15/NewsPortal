import { TemplateDefinition } from '../types';

export const techcrunchTemplate: TemplateDefinition = {
  id: 'techcrunch',
  name: 'TechCrunch',
  description: 'Startup and tech news style with green accents and modern cards',
  preview: '/templates/techcrunch-preview.png',
  category: 'tech',
  
  layout: {
    header: 'standard',
    navigation: 'horizontal',
    homepage: 'magazine',
    categoryPage: 'grid',
    articleCard: 'standard',
  },
  
  typography: {
    headingFont: 'var(--font-inter), system-ui, sans-serif',
    bodyFont: 'var(--font-inter), system-ui, sans-serif',
    headingWeight: 700,
    scale: 'normal',
  },
  
  colors: {
    light: {
      primary: '#0a8e00',
      secondary: '#1a1a1a',
      accent: '#0a8e00',
      background: '#ffffff',
      surface: '#f7f7f7',
      surfaceAlt: '#eeeeee',
      text: '#1a1a1a',
      textMuted: '#666666',
      border: '#e0e0e0',
      success: '#0a8e00',
      warning: '#ff9800',
      error: '#f44336',
    },
    dark: {
      primary: '#3ecf3e',
      secondary: '#e0e0e0',
      accent: '#3ecf3e',
      background: '#121212',
      surface: '#1e1e1e',
      surfaceAlt: '#2a2a2a',
      text: '#ffffff',
      textMuted: '#a0a0a0',
      border: '#333333',
      success: '#3ecf3e',
      warning: '#ffc107',
      error: '#ff5252',
    },
  },
  
  features: {
    darkMode: true,
    animations: true,
    roundedCorners: 'md',
    shadows: 'medium',
    stickyHeader: true,
    showBreadcrumbs: false,
    showReadingTime: false,
    showAuthor: true,
    categoryBadges: true,
  },
  
  spacing: {
    containerMax: '1200px',
    sectionGap: '2rem',
    cardGap: '1.25rem',
    headerHeight: '60px',
  },
};
