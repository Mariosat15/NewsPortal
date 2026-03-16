import { TemplateDefinition } from '../types';

export const vergeTemplate: TemplateDefinition = {
  id: 'verge',
  name: 'Verge',
  description: 'Audacious tech media design with oversized headings, vibrant coral accents, and immersive masonry layouts. The split header and tabbed navigation give a cutting-edge editorial feel that demands attention.',
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
      primary: '#0f0f0f',
      secondary: '#3b3b3b',
      accent: '#fa4b35',
      background: '#ffffff',
      surface: '#fafafa',
      surfaceAlt: '#f3f3f3',
      text: '#0f0f0f',
      textMuted: '#6b6b6b',
      border: '#e8e8e8',
      success: '#00b87c',
      warning: '#ffb800',
      error: '#fa4b35',
    },
    dark: {
      primary: '#ffffff',
      secondary: '#e0e0e0',
      accent: '#ff6b5b',
      background: '#0a0a0a',
      surface: '#161616',
      surfaceAlt: '#222222',
      text: '#ffffff',
      textMuted: '#a3a3a3',
      border: '#2e2e2e',
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
    containerMax: '1480px',
    sectionGap: '3rem',
    cardGap: '1.75rem',
    headerHeight: '72px',
  },
};
