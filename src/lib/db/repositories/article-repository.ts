import { Collection, Filter, Sort, ObjectId } from 'mongodb';
import { getCollection } from '../mongodb';
import { Article, ArticleCreateInput, ArticleUpdateInput, createArticle, createSlug } from '../models/article';

const COLLECTION_NAME = 'articles';

export class ArticleRepository {
  private brandId: string;

  constructor(brandId: string) {
    this.brandId = brandId;
  }

  private async getCollection(): Promise<Collection<Article>> {
    return getCollection<Article>(this.brandId, COLLECTION_NAME);
  }

  // Create a new article
  async create(input: ArticleCreateInput): Promise<Article> {
    const collection = await this.getCollection();
    const article = createArticle(input);
    
    // Ensure unique slug
    let slug = article.slug;
    let counter = 1;
    while (await collection.findOne({ slug })) {
      slug = `${article.slug}-${counter}`;
      counter++;
    }
    article.slug = slug;

    const result = await collection.insertOne(article as Article);
    return { ...article, _id: result.insertedId };
  }

  // Find article by ID
  async findById(id: string | ObjectId): Promise<Article | null> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return collection.findOne({ _id: objectId });
  }

  // Find article by slug
  async findBySlug(slug: string): Promise<Article | null> {
    const collection = await this.getCollection();
    return collection.findOne({ slug });
  }

  // List published articles with pagination
  async listPublished(options: {
    page?: number;
    limit?: number;
    category?: string;
    language?: 'de' | 'en';
    sortBy?: 'publishDate' | 'viewCount' | 'unlockCount';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ articles: Article[]; total: number; pages: number }> {
    const collection = await this.getCollection();
    const { page = 1, limit = 10, category, language, sortBy = 'publishDate', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    const filter: Filter<Article> = {
      status: 'published',
      publishDate: { $lte: new Date() },
    };

    if (category) filter.category = category;
    if (language) filter.language = language;

    const sort: Sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [articles, total] = await Promise.all([
      collection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      articles,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // List all articles (for admin)
  async listAll(options: {
    page?: number;
    limit?: number;
    status?: Article['status'];
    agentGenerated?: boolean;
  } = {}): Promise<{ articles: Article[]; total: number; pages: number }> {
    const collection = await this.getCollection();
    const { page = 1, limit = 20, status, agentGenerated } = options;
    const skip = (page - 1) * limit;

    const filter: Filter<Article> = {};
    if (status) filter.status = status;
    if (agentGenerated !== undefined) filter.agentGenerated = agentGenerated;

    const [articles, total] = await Promise.all([
      collection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      articles,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // Update article
  async update(id: string | ObjectId, input: ArticleUpdateInput): Promise<Article | null> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;

    const updateData: Partial<Article> = {
      ...input,
      updatedAt: new Date(),
    };

    // If title is updated, regenerate slug
    if (input.title) {
      let slug = createSlug(input.title);
      let counter = 1;
      while (await collection.findOne({ slug, _id: { $ne: objectId } })) {
        slug = `${createSlug(input.title)}-${counter}`;
        counter++;
      }
      updateData.slug = slug;
    }

    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result;
  }

  // Delete article
  async delete(id: string | ObjectId): Promise<boolean> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await collection.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }

  // Increment view count
  async incrementViewCount(id: string | ObjectId): Promise<void> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    await collection.updateOne({ _id: objectId }, { $inc: { viewCount: 1 } });
  }

  // Increment unlock count
  async incrementUnlockCount(id: string | ObjectId): Promise<void> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    await collection.updateOne({ _id: objectId }, { $inc: { unlockCount: 1 } });
  }

  // Get trending articles (most views in last 7 days)
  async getTrending(limit: number = 10): Promise<Article[]> {
    const collection = await this.getCollection();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return collection
      .find({
        status: 'published',
        publishDate: { $gte: weekAgo, $lte: new Date() },
      })
      .sort({ viewCount: -1 })
      .limit(limit)
      .toArray();
  }

  // Get categories with article counts
  async getCategories(): Promise<{ category: string; count: number }[]> {
    const collection = await this.getCollection();
    const result = await collection
      .aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { category: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    return result as { category: string; count: number }[];
  }

  // Search articles
  async search(query: string, options: {
    page?: number;
    limit?: number;
    language?: 'de' | 'en';
  } = {}): Promise<{ articles: Article[]; total: number }> {
    const collection = await this.getCollection();
    const { page = 1, limit = 10, language } = options;
    const skip = (page - 1) * limit;

    // Create text index if it doesn't exist
    try {
      await collection.createIndex({ title: 'text', teaser: 'text', content: 'text' });
    } catch {
      // Index might already exist
    }

    const filter: Filter<Article> = {
      $text: { $search: query },
      status: 'published',
      publishDate: { $lte: new Date() },
    };

    if (language) filter.language = language;

    const [articles, total] = await Promise.all([
      collection
        .find(filter, { projection: { score: { $meta: 'textScore' } } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return { articles, total };
  }
}

// Factory function to get repository for a brand
export function getArticleRepository(brandId: string): ArticleRepository {
  return new ArticleRepository(brandId);
}
