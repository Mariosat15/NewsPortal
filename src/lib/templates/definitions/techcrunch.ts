import { TemplateDefinition } from '../types';

export const techcrunchTemplate: TemplateDefinition = {
  id: 'techcrunch',
  name: 'TechCrunch',
  description: 'Silicon Valley startup culture meets editorial design — clean card-based layouts with signature green accents, rounded corners, and medium shadows that give every article an app-store polish.',
  preview: '/templates/techcrunch-preview.png',
  category: 'tech',
  
  layout: {
    header: 'standard',
    navigation: 'horizontal',
    homepage: 'magazine',
    categoryPage: 'grid',
    articleCard: 'standard',
  },
  
  typography: {
    headingFont: 'var(--font-inter), system-ui, sans-serif',
    bodyFont: 'var(--font-inter), system-ui, sans-serif',
    headingWeight: 700,
    scale: 'normal',
  },
  
  colors: {
    light: {
      primary: '#0a8e00',
      secondary: '#1a1a1a',
      accent: '#0a8e00',
      background: '#f9fafb',
      surface: '#ffffff',
      surfaceAlt: '#f3f4f6',
      text: '#111827',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      success: '#0a8e00',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    dark: {
      primary: '#3ecf3e',
      secondary: '#e5e7eb',
      accent: '#3ecf3e',
      background: '#0f1117',
      surface: '#1a1d28',
      surfaceAlt: '#252836',
      text: '#f9fafb',
      textMuted: '#9ca3af',
      border: '#374151',
      success: '#3ecf3e',
      warning: '#fbbf24',
      error: '#f87171',
    },
  },
  
  features: {
    darkMode: true,
    animations: true,
    roundedCorners: 'md',
    shadows: 'medium',
    stickyHeader: true,
    showBreadcrumbs: false,
    showReadingTime: false,
    showAuthor: true,
    categoryBadges: true,
  },
  
  spacing: {
    containerMax: '1200px',
    sectionGap: '2rem',
    cardGap: '1.25rem',
    headerHeight: '60px',
  },
};
