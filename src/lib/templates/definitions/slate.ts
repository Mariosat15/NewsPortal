import { TemplateDefinition } from '../types';

export const slateTemplate: TemplateDefinition = {
  id: 'slate',
  name: 'Slate',
  description: 'Opinion-focused magazine style with sidebar navigation',
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
    headingFont: '"Mercury Display", "Georgia", serif',
    bodyFont: '"Freight Text Pro", "Georgia", serif',
    headingWeight: 700,
    scale: 'normal',
  },
  
  colors: {
    light: {
      primary: '#333333',
      secondary: '#666666',
      accent: '#00a878',
      background: '#ffffff',
      surface: '#fafafa',
      surfaceAlt: '#f0f0f0',
      text: '#333333',
      textMuted: '#777777',
      border: '#e5e5e5',
      success: '#00a878',
      warning: '#f5a623',
      error: '#e53935',
    },
    dark: {
      primary: '#ffffff',
      secondary: '#cccccc',
      accent: '#4dd599',
      background: '#1a1a1a',
      surface: '#252525',
      surfaceAlt: '#303030',
      text: '#ffffff',
      textMuted: '#999999',
      border: '#404040',
      success: '#4dd599',
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
