import { TemplateDefinition } from '../types';

export const voxTemplate: TemplateDefinition = {
  id: 'vox',
  name: 'Vox',
  description: 'Distinctive explanatory journalism design with warm golden accents, card-based layouts, and a welcoming editorial voice. Combines bold display headings with elegant body serif for maximum readability.',
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
      primary: '#1a1a1a',
      secondary: '#4a4a4a',
      accent: '#e6a800',
      background: '#fffcf2',
      surface: '#ffffff',
      surfaceAlt: '#fef9e7',
      text: '#1a1a1a',
      textMuted: '#666666',
      border: '#e8e3d0',
      success: '#2e7d32',
      warning: '#e6a800',
      error: '#c62828',
    },
    dark: {
      primary: '#fffef5',
      secondary: '#d4d0c4',
      accent: '#ffcc33',
      background: '#1a1917',
      surface: '#262522',
      surfaceAlt: '#33322e',
      text: '#f5f0e0',
      textMuted: '#a09a8a',
      border: '#44443e',
      success: '#66bb6a',
      warning: '#ffcc33',
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
