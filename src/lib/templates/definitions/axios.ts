import { TemplateDefinition } from '../types';

export const axiosTemplate: TemplateDefinition = {
  id: 'axios',
  name: 'Axios',
  description: 'Ultra-minimal briefing-style design that strips news to its essence. A narrow single-column layout with timeline navigation and compact cards delivers rapid "smart brevity" for busy professionals.',
  preview: '/templates/axios-preview.png',
  category: 'minimal',
  
  layout: {
    header: 'minimal',
    navigation: 'horizontal',
    homepage: 'minimal',
    categoryPage: 'timeline',
    articleCard: 'compact',
  },
  
  typography: {
    headingFont: 'var(--font-dm-sans), system-ui, sans-serif',
    bodyFont: 'var(--font-dm-sans), system-ui, sans-serif',
    headingWeight: 600,
    scale: 'compact',
  },
  
  colors: {
    light: {
      primary: '#333f51',
      secondary: '#546e7a',
      accent: '#2564eb',
      background: '#ffffff',
      surface: '#f8f9fb',
      surfaceAlt: '#eef1f6',
      text: '#1e293b',
      textMuted: '#64748b',
      border: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    dark: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      accent: '#60a5fa',
      background: '#0f172a',
      surface: '#1e293b',
      surfaceAlt: '#334155',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      border: '#334155',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
    },
  },
  
  features: {
    darkMode: true,
    animations: false,
    roundedCorners: 'md',
    shadows: 'none',
    stickyHeader: true,
    showBreadcrumbs: false,
    showReadingTime: false,
    showAuthor: false,
    categoryBadges: false,
  },
  
  spacing: {
    containerMax: '680px',
    sectionGap: '1.5rem',
    cardGap: '1rem',
    headerHeight: '52px',
  },
};
