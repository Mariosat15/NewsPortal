import { TemplateDefinition } from '../types';

export const mediumTemplate: TemplateDefinition = {
  id: 'medium',
  name: 'Medium',
  description: 'Clean, reading-focused design with minimal distractions',
  preview: '/templates/medium-preview.png',
  category: 'minimal',
  
  layout: {
    header: 'centered',
    navigation: 'horizontal',
    homepage: 'minimal',
    categoryPage: 'list',
    articleCard: 'minimal',
  },
  
  typography: {
    headingFont: 'var(--font-lora), Georgia, serif',
    bodyFont: 'var(--font-source-serif), Georgia, serif',
    headingWeight: 700,
    scale: 'spacious',
  },
  
  colors: {
    light: {
      primary: '#242424',
      secondary: '#6b6b6b',
      accent: '#1a8917',
      background: '#ffffff',
      surface: '#ffffff',
      surfaceAlt: '#fafafa',
      text: '#242424',
      textMuted: '#757575',
      border: '#e6e6e6',
      success: '#1a8917',
      warning: '#e6a700',
      error: '#c94a4a',
    },
    dark: {
      primary: '#e6e6e6',
      secondary: '#a0a0a0',
      accent: '#49de48',
      background: '#121212',
      surface: '#191919',
      surfaceAlt: '#242424',
      text: '#e6e6e6',
      textMuted: '#a0a0a0',
      border: '#333333',
      success: '#49de48',
      warning: '#ffd54f',
      error: '#ef5350',
    },
  },
  
  features: {
    darkMode: true,
    animations: false,
    roundedCorners: 'none',
    shadows: 'none',
    stickyHeader: false,
    showBreadcrumbs: false,
    showReadingTime: true,
    showAuthor: true,
    categoryBadges: false,
  },
  
  spacing: {
    containerMax: '728px',
    sectionGap: '3rem',
    cardGap: '2rem',
    headerHeight: '56px',
  },
};
