import { TemplateDefinition } from '../types';

export const slateTemplate: TemplateDefinition = {
  id: 'slate',
  name: 'Slate',
  description: 'Opinionated magazine layout with a distinctive teal accent, split header design, and sidebar navigation. Elegant Playfair headings against serif body text create a literary, essay-driven aesthetic.',
  preview: '/templates/slate-preview.png',
  category: 'magazine',
  
  layout: {
    header: 'split',
    navigation: 'sidebar',
    homepage: 'magazine',
    categoryPage: 'featured-grid',
    articleCard: 'standard',
  },
  
  typography: {
    headingFont: 'var(--font-playfair), Georgia, serif',
    bodyFont: 'var(--font-source-serif), Georgia, serif',
    headingWeight: 700,
    scale: 'normal',
  },
  
  colors: {
    light: {
      primary: '#2d2d2d',
      secondary: '#5a5a5a',
      accent: '#009688',
      background: '#fbfbfb',
      surface: '#ffffff',
      surfaceAlt: '#f5f7f6',
      text: '#2d2d2d',
      textMuted: '#777777',
      border: '#e0e4e2',
      success: '#009688',
      warning: '#f5a623',
      error: '#e53935',
    },
    dark: {
      primary: '#f5f5f5',
      secondary: '#c8c8c8',
      accent: '#4dd5c4',
      background: '#171a19',
      surface: '#222725',
      surfaceAlt: '#2e3330',
      text: '#f0f0f0',
      textMuted: '#909a96',
      border: '#3a403d',
      success: '#4dd5c4',
      warning: '#ffc107',
      error: '#ff5252',
    },
  },
  
  features: {
    darkMode: true,
    animations: true,
    roundedCorners: 'sm',
    shadows: 'subtle',
    stickyHeader: false,
    showBreadcrumbs: true,
    showReadingTime: true,
    showAuthor: true,
    categoryBadges: true,
  },
  
  spacing: {
    containerMax: '1280px',
    sectionGap: '2rem',
    cardGap: '1.5rem',
    headerHeight: '70px',
  },
};
