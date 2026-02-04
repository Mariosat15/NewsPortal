import { Collection, ObjectId } from 'mongodb';
import { getCollection } from '../mongodb';
import {
  LandingPage,
  LandingPageCreateInput,
  LandingPageUpdateInput,
  LandingPageStatus,
} from '../models/landing-page';

export class LandingPageRepository {
  private brandId: string;
  private collectionPromise: Promise<Collection<LandingPage>>;

  constructor(brandId: string) {
    this.brandId = brandId;
    this.collectionPromise = this.initCollection();
  }

  private async initCollection(): Promise<Collection<LandingPage>> {
    const collection = await getCollection<LandingPage>(this.brandId, 'landing_pages');
    
    // Create indexes
    await collection.createIndex({ slug: 1, tenantId: 1 }, { unique: true });
    await collection.createIndex({ status: 1 });
    await collection.createIndex({ tenantId: 1 });
    await collection.createIndex({ createdAt: -1 });
    
    return collection;
  }

  private async getCollection(): Promise<Collection<LandingPage>> {
    return this.collectionPromise;
  }

  async create(input: LandingPageCreateInput): Promise<LandingPage> {
    const collection = await this.getCollection();
    const now = new Date();

    const landingPage: LandingPage = {
      tenantId: input.tenantId,
      slug: input.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      name: input.name,
      layout: input.layout,
      config: input.config,
      trackingDefaults: input.trackingDefaults || {},
      status: input.status || 'draft',
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(landingPage);
    return { ...landingPage, _id: result.insertedId };
  }

  async findById(id: string | ObjectId): Promise<LandingPage | null> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return collection.findOne({ _id: objectId });
  }

  async findBySlug(slug: string, tenantId?: string): Promise<LandingPage | null> {
    const collection = await this.getCollection();
    const query: Record<string, unknown> = { slug: slug.toLowerCase() };
    if (tenantId) {
      query.tenantId = tenantId;
    }
    return collection.findOne(query);
  }

  async findPublishedBySlug(slug: string, tenantId?: string): Promise<LandingPage | null> {
    const collection = await this.getCollection();
    const query: Record<string, unknown> = { 
      slug: slug.toLowerCase(),
      status: 'published'
    };
    if (tenantId) {
      query.tenantId = tenantId;
    }
    return collection.findOne(query);
  }

  async update(id: string | ObjectId, input: LandingPageUpdateInput): Promise<LandingPage | null> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;

    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.slug) updateFields.slug = input.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (input.name) updateFields.name = input.name;
    if (input.layout) updateFields.layout = input.layout;
    if (input.status) updateFields.status = input.status;
    if (input.config) {
      // Merge config
      const existing = await this.findById(objectId);
      if (existing) {
        updateFields.config = { ...existing.config, ...input.config };
      }
    }
    if (input.trackingDefaults) {
      const existing = await this.findById(objectId);
      if (existing) {
        updateFields.trackingDefaults = { ...existing.trackingDefaults, ...input.trackingDefaults };
      }
    }

    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return result;
  }

  async delete(id: string | ObjectId): Promise<boolean> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await collection.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }

  async list(params: {
    tenantId?: string;
    status?: LandingPageStatus;
    page?: number;
    limit?: number;
  } = {}): Promise<{ pages: LandingPage[]; total: number }> {
    const collection = await this.getCollection();
    const { tenantId, status, page = 1, limit = 20 } = params;

    const query: Record<string, unknown> = {};
    if (tenantId) query.tenantId = tenantId;
    if (status) query.status = status;

    const [pages, total] = await Promise.all([
      collection
        .find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ]);

    return { pages, total };
  }

  async publish(id: string | ObjectId): Promise<LandingPage | null> {
    return this.update(id, { status: 'published' });
  }

  async unpublish(id: string | ObjectId): Promise<LandingPage | null> {
    return this.update(id, { status: 'draft' });
  }

  async duplicate(id: string | ObjectId, newSlug: string, newName: string): Promise<LandingPage> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error('Landing page not found');
    }

    return this.create({
      tenantId: original.tenantId,
      slug: newSlug,
      name: newName,
      layout: original.layout,
      config: original.config,
      trackingDefaults: original.trackingDefaults,
      status: 'draft',
    });
  }
}

// Factory function
let repositories: Map<string, LandingPageRepository> = new Map();

export function getLandingPageRepository(brandId: string): LandingPageRepository {
  if (!repositories.has(brandId)) {
    repositories.set(brandId, new LandingPageRepository(brandId));
  }
  return repositories.get(brandId)!;
}
