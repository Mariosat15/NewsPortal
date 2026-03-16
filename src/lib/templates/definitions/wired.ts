import { TemplateDefinition } from '../types';

export const wiredTemplate: TemplateDefinition = {
  id: 'wired',
  name: 'Wired',
  description: 'Futuristic tech publication design with geometric precision, electric cyan accents, and a high-contrast aesthetic. Grid-based layouts echo circuit-board patterns for a distinctly digital-native feel.',
  preview: '/templates/wired-preview.png',
  category: 'tech',
  
  layout: {
    header: 'minimal',
    navigation: 'horizontal',
    homepage: 'grid',
    categoryPage: 'grid',
    articleCard: 'overlay',
  },
  
  typography: {
    headingFont: 'var(--font-space-grotesk), system-ui, sans-serif',
    bodyFont: 'var(--font-source-sans), system-ui, sans-serif',
    headingWeight: 700,
    scale: 'normal',
  },
  
  colors: {
    light: {
      primary: '#0a0a0a',
      secondary: '#2d2d2d',
      accent: '#00bcd4',
      background: '#fafafa',
      surface: '#ffffff',
      surfaceAlt: '#f0f4f8',
      text: '#0a0a0a',
      textMuted: '#5a5a5a',
      border: '#e2e8f0',
      success: '#00e676',
      warning: '#ffd600',
      error: '#ff1744',
    },
    dark: {
      primary: '#f0f0f0',
      secondary: '#c0c0c0',
      accent: '#00e5ff',
      background: '#050510',
      surface: '#0d0d1a',
      surfaceAlt: '#1a1a2e',
      text: '#f0f0f0',
      textMuted: '#7a7a9a',
      border: '#2a2a40',
      success: '#00e676',
      warning: '#ffd600',
      error: '#ff1744',
    },
  },
  
  features: {
    darkMode: true,
    animations: true,
    roundedCorners: 'sm',
    shadows: 'subtle',
    stickyHeader: true,
    showBreadcrumbs: false,
    showReadingTime: true,
    showAuthor: true,
    categoryBadges: true,
  },
  
  spacing: {
    containerMax: '1440px',
    sectionGap: '2.75rem',
    cardGap: '1.5rem',
    headerHeight: '56px',
  },
};
