import { Collection } from 'mongodb';
import { getCollection } from '../mongodb';
import { AdminAction, AdminActionCreateInput } from '../models/admin-action';

export class AdminActionRepository {
  private collectionPromise: Promise<Collection<AdminAction>>;

  constructor(brandId: string) {
    this.collectionPromise = this.initCollection(brandId);
  }

  private async initCollection(brandId: string): Promise<Collection<AdminAction>> {
    const collection = await getCollection<AdminAction>(brandId, 'admin_actions');

    // Indexes for fast lookups
    await collection.createIndex({ timestamp: -1 });
    await collection.createIndex({ resource: 1, timestamp: -1 });
    await collection.createIndex({ adminUser: 1, timestamp: -1 });
    await collection.createIndex({ action: 1 });

    return collection;
  }

  async log(input: AdminActionCreateInput): Promise<AdminAction> {
    const collection = await this.collectionPromise;
    const action: AdminAction = {
      ...input,
      timestamp: new Date(),
    };
    const result = await collection.insertOne(action);
    return { ...action, _id: result.insertedId };
  }

  async list(params: {
    page?: number;
    limit?: number;
    resource?: string;
    action?: string;
    adminUser?: string;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}): Promise<{ actions: AdminAction[]; total: number }> {
    const collection = await this.collectionPromise;
    const { page = 1, limit = 50, resource, action, adminUser, dateFrom, dateTo } = params;

    const query: Record<string, unknown> = {};
    if (resource) query.resource = resource;
    if (action) query.action = action;
    if (adminUser) query.adminUser = { $regex: adminUser, $options: 'i' };
    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) (query.timestamp as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (query.timestamp as Record<string, Date>).$lte = dateTo;
    }

    const [actions, total] = await Promise.all([
      collection
        .find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ]);

    return { actions, total };
  }

  async getRecent(limit: number = 20): Promise<AdminAction[]> {
    const collection = await this.collectionPromise;
    return collection
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }
}

// Singleton factory
const repositories = new Map<string, AdminActionRepository>();

export function getAdminActionRepository(brandId: string): AdminActionRepository {
  if (!repositories.has(brandId)) {
    repositories.set(brandId, new AdminActionRepository(brandId));
  }
  return repositories.get(brandId)!;
}
