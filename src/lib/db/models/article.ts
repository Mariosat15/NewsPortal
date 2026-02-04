import { ObjectId } from 'mongodb';

export type ArticleStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface Article {
  _id?: ObjectId;
  slug: string;
  title: string;
  teaser: string;
  content: string;
  thumbnail: string;
  category: string;
  tags: string[];
  status: ArticleStatus;
  publishDate: Date;
  createdAt: Date;
  updatedAt: Date;
  agentGenerated: boolean;
  viewCount: number;
  unlockCount: number;
  language: 'de' | 'en';
}

export interface ArticleCreateInput {
  title: string;
  teaser: string;
  content: string;
  thumbnail?: string;
  category: string;
  tags?: string[];
  status?: ArticleStatus;
  publishDate?: Date;
  agentGenerated?: boolean;
  language?: 'de' | 'en';
}

export interface ArticleUpdateInput {
  title?: string;
  teaser?: string;
  content?: string;
  thumbnail?: string;
  category?: string;
  tags?: string[];
  status?: ArticleStatus;
  publishDate?: Date;
}

// Helper function to create a slug from title
export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

// Create article with defaults
export function createArticle(input: ArticleCreateInput): Omit<Article, '_id'> {
  const now = new Date();
  return {
    slug: createSlug(input.title),
    title: input.title,
    teaser: input.teaser,
    content: input.content,
    thumbnail: input.thumbnail || '/images/placeholder.jpg',
    category: input.category,
    tags: input.tags || [],
    status: input.status || 'draft',
    publishDate: input.publishDate || now,
    createdAt: now,
    updatedAt: now,
    agentGenerated: input.agentGenerated || false,
    viewCount: 0,
    unlockCount: 0,
    language: input.language || 'de',
  };
}
