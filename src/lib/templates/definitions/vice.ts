import { TemplateDefinition } from '../types';

export const viceTemplate: TemplateDefinition = {
  id: 'vice',
  name: 'Vice',
  description: 'Bold media style with edge-to-edge images and dramatic layouts',
  preview: '/templates/vice-preview.png',
  category: 'magazine',
  
  layout: {
    header: 'mega',
    navigation: 'hamburger',
    homepage: 'masonry',
    categoryPage: 'masonry',
    articleCard: 'bold',
  },
  
  typography: {
    headingFont: 'var(--font-dm-sans), system-ui, sans-serif',
    bodyFont: 'var(--font-inter), system-ui, sans-serif',
    headingWeight: 700,
    scale: 'spacious',
  },
  
  colors: {
    light: {
      primary: '#000000',
      secondary: '#333333',
      accent: '#e60f00',
      background: '#ffffff',
      surface: '#f5f5f5',
      surfaceAlt: '#ebebeb',
      text: '#000000',
      textMuted: '#555555',
      border: '#dddddd',
      success: '#00c853',
      warning: '#ffab00',
      error: '#e60f00',
    },
    dark: {
      primary: '#ffffff',
      secondary: '#e0e0e0',
      accent: '#ff4444',
      background: '#000000',
      surface: '#111111',
      surfaceAlt: '#1a1a1a',
      text: '#ffffff',
      textMuted: '#aaaaaa',
      border: '#333333',
      success: '#69f0ae',
      warning: '#ffd740',
      error: '#ff4444',
    },
  },
  
  features: {
    darkMode: true,
    animations: true,
    roundedCorners: 'none',
    shadows: 'strong',
    stickyHeader: false,
    showBreadcrumbs: false,
    showReadingTime: true,
    showAuthor: true,
    categoryBadges: true,
  },
  
  spacing: {
    containerMax: '1400px',
    sectionGap: '2rem',
    cardGap: '1rem',
    headerHeight: '70px',
  },
};
