export interface RSSFeed {
  url: string;
  name: string;
  category: string;
  language: 'de' | 'en';
  enabled: boolean;
}

export interface AIModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export type ArticleType = 'news' | 'analysis' | 'opinion' | 'summary' | 'investigative' | 'guide' | 'recipe' | 'review' | 'listicle' | 'profile';

export interface VideoSettings {
  enabled: boolean;
  includeYouTube: boolean;
  includeTikTok: boolean;
  categoriesWithVideos: string[]; // Categories that should fetch videos (empty = all)
}

export interface ArticleStyle {
  type?: ArticleType; // Deprecated - use types
  types: ArticleType[]; // Multiple types supported
  tone: 'neutral' | 'engaging' | 'formal' | 'conversational';
  depth: 'brief' | 'standard' | 'in-depth';
  includeImages: boolean;
  includeQuotes: boolean;
  includeSources: boolean;
  includeVideos?: boolean; // Per-style video override
}

export interface AgentConfig {
  enabled: boolean;
  topics: string[];
  defaultLanguage: 'de' | 'en';
  maxArticlesPerRun: number;
  cronSchedule: string;
  brandId?: string; // For rotation tracking
  
  // RSS Feeds
  rssFeeds: RSSFeed[];
  useRSSFeeds: boolean;
  
  // AI Model Settings
  aiModel: AIModelConfig;
  
  // Article Generation Settings
  articleStyle: ArticleStyle;
  articleStyles?: ArticleStyle[];
  defaultArticleStyle?: ArticleStyle;
  minWordCount: number;
  maxWordCount: number;
  
  // Video Settings
  videoSettings?: VideoSettings;
  
  // Quality Settings
  minQualityScore: number;
  requireFactCheck?: boolean;
  requireSourceAttribution?: boolean;
  
  // Distribution Settings
  distributeEvenly: boolean;
}

export interface GatheredTopic {
  id: string;
  topic: string;
  category: string;
  sources: {
    url: string;
    title: string;
    snippet: string;
    publishDate?: string;
    source: string;
  }[];
  gatheredAt: Date;
}

export interface DraftArticle {
  id: string;
  topicId: string;
  title: string;
  teaser: string;
  content: string;
  category: string;
  tags: string[];
  sources: string[];
  language: 'de' | 'en';
  draftedAt: Date;
}

export interface EditedArticle extends DraftArticle {
  editedAt: Date;
  editNotes: string;
  qualityScore: number; // 1-10
}

export interface PublishedArticle extends EditedArticle {
  publishedAt: Date;
  articleId: string;
  slug: string;
}

export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
}

export interface AgentRunLog {
  agentName: string;
  brandId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  itemsProcessed: number;
  itemsSuccessful: number;
  itemsFailed: number;
  errors: string[];
  metadata?: Record<string, unknown>;
}
