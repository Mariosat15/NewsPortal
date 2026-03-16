import { TemplateDefinition } from '../types';

export const guardianTemplate: TemplateDefinition = {
  id: 'guardian',
  name: 'Guardian',
  description: 'Award-winning editorial design inspired by the world\'s most trusted broadsheet. Features sophisticated serif typography, a classic masthead, and a two-column editorial layout that prioritizes long-form journalism.',
  preview: '/templates/guardian-preview.png',
  category: 'editorial',
  
  layout: {
    header: 'standard',
    navigation: 'horizontal',
    homepage: 'editorial',
    categoryPage: 'featured-grid',
    articleCard: 'overlay',
  },
  
  typography: {
    headingFont: 'var(--font-merriweather), Georgia, serif',
    bodyFont: 'var(--font-merriweather), Georgia, serif',
    headingWeight: 700,
    scale: 'normal',
  },
  
  colors: {
    light: {
      primary: '#052962',
      secondary: '#1a73e8',
      accent: '#c70000',
      background: '#f6f6f6',
      surface: '#ffffff',
      surfaceAlt: '#f1f1f1',
      text: '#121212',
      textMuted: '#707070',
      border: '#dcdcdc',
      success: '#22874d',
      warning: '#ff7800',
      error: '#c70000',
    },
    dark: {
      primary: '#90caf9',
      secondary: '#64b5f6',
      accent: '#ff6b6b',
      background: '#1a1a2e',
      surface: '#16213e',
      surfaceAlt: '#0f3460',
      text: '#f0f0f0',
      textMuted: '#9e9e9e',
      border: '#2d3a5e',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
    },
  },
  
  features: {
    darkMode: true,
    animations: true,
    roundedCorners: 'sm',
    shadows: 'subtle',
    stickyHeader: true,
    showBreadcrumbs: true,
    showReadingTime: true,
    showAuthor: true,
    categoryBadges: true,
  },
  
  spacing: {
    containerMax: '1300px',
    sectionGap: '2rem',
    cardGap: '1.25rem',
    headerHeight: '64px',
  },
};
