import { TemplateDefinition } from '../types';

export const wiredTemplate: TemplateDefinition = {
  id: 'wired',
  name: 'Wired',
  description: 'Futuristic tech design with geometric elements and neon accents',
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
      primary: '#000000',
      secondary: '#333333',
      accent: '#00ffff',
      background: '#ffffff',
      surface: '#f5f5f5',
      surfaceAlt: '#eeeeee',
      text: '#000000',
      textMuted: '#666666',
      border: '#e0e0e0',
      success: '#00e676',
      warning: '#ffea00',
      error: '#ff1744',
    },
    dark: {
      primary: '#ffffff',
      secondary: '#e0e0e0',
      accent: '#00ffff',
      background: '#0a0a0a',
      surface: '#141414',
      surfaceAlt: '#1f1f1f',
      text: '#ffffff',
      textMuted: '#888888',
      border: '#2a2a2a',
      success: '#00e676',
      warning: '#ffea00',
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
    headerHeight: '64px',
  },
};
