export interface AgentConfig {
  enabled: boolean;
  topics: string[];
  language: 'de' | 'en';
  maxArticlesPerRun: number;
  cronSchedule: string;
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
