import { TemplateDefinition } from '../types';

export const viceTemplate: TemplateDefinition = {
  id: 'vice',
  name: 'Vice',
  description: 'Counter-culture media design with stark black-and-white contrast, edge-to-edge imagery, and heavy shadows. The masonry layout with bold cards and hamburger navigation creates an unapologetically visual-first experience.',
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
      secondary: '#2d2d2d',
      accent: '#e60012',
      background: '#ffffff',
      surface: '#f8f8f8',
      surfaceAlt: '#f0f0f0',
      text: '#000000',
      textMuted: '#555555',
      border: '#e0e0e0',
      success: '#00c853',
      warning: '#ffab00',
      error: '#e60012',
    },
    dark: {
      primary: '#ffffff',
      secondary: '#d4d4d4',
      accent: '#ff3344',
      background: '#000000',
      surface: '#0f0f0f',
      surfaceAlt: '#1a1a1a',
      text: '#ffffff',
      textMuted: '#a0a0a0',
      border: '#2a2a2a',
      success: '#69f0ae',
      warning: '#ffd740',
      error: '#ff3344',
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
    cardGap: '0.75rem',
    headerHeight: '70px',
  },
};
