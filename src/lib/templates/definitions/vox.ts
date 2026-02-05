import { TemplateDefinition } from '../types';

export const voxTemplate: TemplateDefinition = {
  id: 'vox',
  name: 'Vox',
  description: 'Explanatory journalism style with bold typography and colorful cards',
  preview: '/templates/vox-preview.png',
  category: 'editorial',
  
  layout: {
    header: 'standard',
    navigation: 'tabbed',
    homepage: 'cards',
    categoryPage: 'grid',
    articleCard: 'bold',
  },
  
  typography: {
    headingFont: 'var(--font-dm-sans), system-ui, sans-serif',
    bodyFont: 'var(--font-source-serif), Georgia, serif',
    headingWeight: 800,
    scale: 'normal',
  },
  
  colors: {
    light: {
      primary: '#222222',
      secondary: '#545454',
      accent: '#facd00',
      background: '#fffcf2',
      surface: '#ffffff',
      surfaceAlt: '#fff8e1',
      text: '#222222',
      textMuted: '#666666',
      border: '#e0dcd0',
      success: '#2e7d32',
      warning: '#facd00',
      error: '#c62828',
    },
    dark: {
      primary: '#ffffff',
      secondary: '#cccccc',
      accent: '#ffe066',
      background: '#1a1a17',
      surface: '#262622',
      surfaceAlt: '#33332e',
      text: '#ffffff',
      textMuted: '#a0a09a',
      border: '#44443e',
      success: '#66bb6a',
      warning: '#ffe066',
      error: '#ef5350',
    },
  },
  
  features: {
    darkMode: true,
    animations: true,
    roundedCorners: 'md',
    shadows: 'medium',
    stickyHeader: true,
    showBreadcrumbs: true,
    showReadingTime: true,
    showAuthor: true,
    categoryBadges: true,
  },
  
  spacing: {
    containerMax: '1200px',
    sectionGap: '2.5rem',
    cardGap: '1.5rem',
    headerHeight: '64px',
  },
};
