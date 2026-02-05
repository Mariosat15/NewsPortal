// Template System Type Definitions

export type HeaderStyle = 'standard' | 'centered' | 'split' | 'minimal' | 'mega' | 'sticky-compact';
export type NavigationStyle = 'horizontal' | 'sidebar' | 'mega-menu' | 'hamburger' | 'tabbed';
export type HomepageLayout = 'magazine' | 'grid' | 'masonry' | 'cards' | 'editorial' | 'minimal';
export type CategoryLayout = 'grid' | 'list' | 'masonry' | 'featured-grid' | 'timeline';
export type ArticleCardStyle = 'standard' | 'compact' | 'overlay' | 'horizontal' | 'minimal' | 'bold';
export type CornerRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type ShadowIntensity = 'none' | 'subtle' | 'medium' | 'strong';
export type TypographyScale = 'compact' | 'normal' | 'spacious';

export interface TemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface TemplateTypography {
  headingFont: string;
  bodyFont: string;
  headingWeight: number;
  scale: TypographyScale;
}

export interface TemplateLayout {
  header: HeaderStyle;
  navigation: NavigationStyle;
  homepage: HomepageLayout;
  categoryPage: CategoryLayout;
  articleCard: ArticleCardStyle;
}

export interface TemplateFeatures {
  darkMode: boolean;
  animations: boolean;
  roundedCorners: CornerRadius;
  shadows: ShadowIntensity;
  stickyHeader: boolean;
  showBreadcrumbs: boolean;
  showReadingTime: boolean;
  showAuthor: boolean;
  categoryBadges: boolean;
}

export interface TemplateSpacing {
  containerMax: string;
  sectionGap: string;
  cardGap: string;
  headerHeight: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  preview: string;
  category: 'financial' | 'editorial' | 'tech' | 'minimal' | 'news' | 'magazine';
  layout: TemplateLayout;
  typography: TemplateTypography;
  colors: {
    light: TemplateColors;
    dark: TemplateColors;
  };
  features: TemplateFeatures;
  spacing: TemplateSpacing;
}

export interface TemplateSettings {
  templateId: string;
  colorMode: 'light' | 'dark' | 'system';
  customColors?: Partial<TemplateColors>;
}

export interface ResolvedTemplate extends TemplateDefinition {
  activeColors: TemplateColors;
  cssVariables: Record<string, string>;
}

// Category with aliases support
export interface CategoryConfig {
  slug: string;
  aliases: string[];
  displayName: { de: string; en: string };
  description: { de: string; en: string };
  icon: string;
  color: string;
  gradient?: string;
  enabled: boolean;
  order: number;
}

// Article for template components
export interface TemplateArticle {
  _id: string;
  title: string;
  slug: string;
  teaser: string;
  thumbnail?: string;
  category: string;
  publishDate: string;
  readingTime?: number;
  author?: string;
  tags?: string[];
  viewCount?: number;
}

// Props for template components
export interface HeaderProps {
  template: ResolvedTemplate;
  categories: CategoryConfig[];
  locale: string;
  brandName: string;
  logoUrl?: string;
}

export interface CategoryPageProps {
  template: ResolvedTemplate;
  category: CategoryConfig;
  articles: TemplateArticle[];
  locale: string;
  totalPages: number;
  currentPage: number;
}

export interface HomePageProps {
  template: ResolvedTemplate;
  articles: TemplateArticle[];
  categories: CategoryConfig[];
  locale: string;
  featuredArticles?: TemplateArticle[];
  trendingArticles?: TemplateArticle[];
}

export interface NavigationProps {
  template: ResolvedTemplate;
  categories: CategoryConfig[];
  locale: string;
  currentPath?: string;
  currentCategory?: string;
}

// Props for category layout components
export interface CategoryLayoutProps {
  template: ResolvedTemplate;
  articles: TemplateArticle[];
  locale: string;
  categoryName: string;
  categorySlug?: string;
}

// Props for home layout components
export interface HomeLayoutProps {
  template: ResolvedTemplate;
  articles: TemplateArticle[];
  categories: CategoryConfig[];
  locale: string;
}

// Simplified TemplateArticle for compatibility with card components
export interface ArticleForCard {
  slug: string;
  title: string;
  excerpt?: string;
  image?: string;
  category?: string;
  author?: string;
  date?: string;
  readingTime?: string;
}

// Props for article cards with simpler article interface  
export interface ArticleCardProps {
  article: ArticleForCard;
  template: ResolvedTemplate;
  locale: string;
  showCategory?: boolean;
  showAuthor?: boolean;
  showReadingTime?: boolean;
}
