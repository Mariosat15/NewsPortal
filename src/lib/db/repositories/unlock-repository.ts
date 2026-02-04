import { Collection, ObjectId } from 'mongodb';
import { getCollection } from '../mongodb';
import { Unlock, UnlockCreateInput, createUnlock } from '../models/unlock';
import { normalizeMSISDN } from '../models/user';

const COLLECTION_NAME = 'unlocks';

export class UnlockRepository {
  private brandId: string;

  constructor(brandId: string) {
    this.brandId = brandId;
  }

  private async getCollection(): Promise<Collection<Unlock>> {
    return getCollection<Unlock>(this.brandId, COLLECTION_NAME);
  }

  // Create an unlock record
  async create(input: UnlockCreateInput): Promise<Unlock> {
    const collection = await this.getCollection();
    const unlock = createUnlock(input);
    const result = await collection.insertOne(unlock as Unlock);
    return { ...unlock, _id: result.insertedId };
  }

  // Check if user has unlocked an article
  async hasUnlocked(msisdn: string, articleId: string | ObjectId): Promise<boolean> {
    const collection = await this.getCollection();
    const normalizedMsisdn = normalizeMSISDN(msisdn);
    const articleObjectId = typeof articleId === 'string' ? new ObjectId(articleId) : articleId;

    const unlock = await collection.findOne({
      normalizedMsisdn,
      articleId: articleObjectId,
      status: 'completed',
    });

    return unlock !== null;
  }

  // Get all unlocks for a user
  async getUserUnlocks(msisdn: string): Promise<Unlock[]> {
    const collection = await this.getCollection();
    const normalizedMsisdn = normalizeMSISDN(msisdn);
    return collection
      .find({ normalizedMsisdn, status: 'completed' })
      .sort({ unlockedAt: -1 })
      .toArray();
  }

  // Get unlocks by article
  async getArticleUnlocks(articleId: string | ObjectId): Promise<Unlock[]> {
    const collection = await this.getCollection();
    const articleObjectId = typeof articleId === 'string' ? new ObjectId(articleId) : articleId;
    return collection
      .find({ articleId: articleObjectId, status: 'completed' })
      .sort({ unlockedAt: -1 })
      .toArray();
  }

  // Get unlock by transaction ID
  async findByTransactionId(transactionId: string): Promise<Unlock | null> {
    const collection = await this.getCollection();
    return collection.findOne({ transactionId });
  }

  // Update unlock status
  async updateStatus(transactionId: string, status: Unlock['status']): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.updateOne(
      { transactionId },
      { $set: { status } }
    );
    return result.modifiedCount > 0;
  }

  // Get user's unlock count
  async getUserUnlockCount(msisdn: string): Promise<number> {
    const collection = await this.getCollection();
    const normalizedMsisdn = normalizeMSISDN(msisdn);
    return collection.countDocuments({
      normalizedMsisdn,
      status: 'completed',
    });
  }

  // Get unlock statistics
  async getStats(dateFrom?: Date, dateTo?: Date): Promise<{
    totalUnlocks: number;
    totalRevenue: number;
    uniqueUsers: number;
  }> {
    const collection = await this.getCollection();
    
    const match: Record<string, unknown> = { status: 'completed' };
    if (dateFrom || dateTo) {
      match.unlockedAt = {};
      if (dateFrom) (match.unlockedAt as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (match.unlockedAt as Record<string, Date>).$lte = dateTo;
    }

    const result = await collection.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalUnlocks: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          uniqueUsers: { $addToSet: '$normalizedMsisdn' },
        },
      },
      {
        $project: {
          totalUnlocks: 1,
          totalRevenue: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
        },
      },
    ]).toArray();

    if (result.length === 0) {
      return { totalUnlocks: 0, totalRevenue: 0, uniqueUsers: 0 };
    }

    return result[0] as {
      totalUnlocks: number;
      totalRevenue: number;
      uniqueUsers: number;
    };
  }

  // List all unlocks with pagination (for admin)
  async listAll(options: {
    page?: number;
    limit?: number;
    msisdn?: string;
    status?: Unlock['status'];
    dateFrom?: Date;
    dateTo?: Date;
  } = {}): Promise<{ unlocks: Unlock[]; total: number; pages: number }> {
    const collection = await this.getCollection();
    const { page = 1, limit = 20, msisdn, status, dateFrom, dateTo } = options;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (msisdn) filter.normalizedMsisdn = normalizeMSISDN(msisdn);
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.unlockedAt = {};
      if (dateFrom) (filter.unlockedAt as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (filter.unlockedAt as Record<string, Date>).$lte = dateTo;
    }

    const [unlocks, total] = await Promise.all([
      collection.find(filter).sort({ unlockedAt: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      unlocks,
      total,
      pages: Math.ceil(total / limit),
    };
  }
}

// Factory function to get repository for a brand
export function getUnlockRepository(brandId: string): UnlockRepository {
  return new UnlockRepository(brandId);
}
