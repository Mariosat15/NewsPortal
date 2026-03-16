import { TemplateDefinition } from '../types';

export const mediumTemplate: TemplateDefinition = {
  id: 'medium',
  name: 'Medium',
  description: 'Distraction-free reading experience with generous white space, elegant serif typography, and a narrow content column. Designed for deep-reading audiences who value substance over spectacle.',
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
      surfaceAlt: '#f9fafb',
      text: '#242424',
      textMuted: '#757575',
      border: '#e6e6e6',
      success: '#1a8917',
      warning: '#e6a700',
      error: '#c94a4a',
    },
    dark: {
      primary: '#e8e8e8',
      secondary: '#a8a8a8',
      accent: '#49de48',
      background: '#0d1117',
      surface: '#161b22',
      surfaceAlt: '#21262d',
      text: '#e6edf3',
      textMuted: '#8b949e',
      border: '#30363d',
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
    containerMax: '780px',
    sectionGap: '3.5rem',
    cardGap: '2.5rem',
    headerHeight: '64px',
  },
};
