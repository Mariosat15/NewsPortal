import { Collection, Filter, ObjectId } from 'mongodb';
import { getCollection } from '../mongodb';
import { User, UserCreateInput, createUser, createVisit, normalizeMSISDN } from '../models/user';

const COLLECTION_NAME = 'users';

export class UserRepository {
  private brandId: string;

  constructor(brandId: string) {
    this.brandId = brandId;
  }

  private async getCollection(): Promise<Collection<User>> {
    return getCollection<User>(this.brandId, COLLECTION_NAME);
  }

  // Create or update user
  async upsert(input: UserCreateInput): Promise<User> {
    const collection = await this.getCollection();
    const normalizedMsisdn = normalizeMSISDN(input.msisdn);

    const existing = await collection.findOne({ normalizedMsisdn });

    if (existing) {
      // Update existing user
      const visit = createVisit(
        input.ip || '',
        input.userAgent || '',
        input.referrer || '',
        input.page || '/',
        input.sessionId || ''
      );

      await collection.updateOne(
        { _id: existing._id },
        {
          $set: { lastSeen: new Date() },
          $push: { visits: { $each: [visit], $slice: -100 } }, // Keep last 100 visits
          $inc: { totalVisits: 1 },
        }
      );

      return (await collection.findOne({ _id: existing._id }))!;
    }

    // Create new user
    const user = createUser(input);
    const result = await collection.insertOne(user as User);
    return { ...user, _id: result.insertedId };
  }

  // Find user by MSISDN
  async findByMsisdn(msisdn: string): Promise<User | null> {
    const collection = await this.getCollection();
    const normalizedMsisdn = normalizeMSISDN(msisdn);
    return collection.findOne({ normalizedMsisdn });
  }

  // Find user by ID
  async findById(id: string | ObjectId): Promise<User | null> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return collection.findOne({ _id: objectId });
  }

  // Track anonymous visit (cookie-based)
  async trackVisit(sessionId: string, visitData: {
    ip: string;
    userAgent: string;
    referrer: string;
    page: string;
  }): Promise<void> {
    const collection = await this.getCollection();
    const visit = createVisit(
      visitData.ip,
      visitData.userAgent,
      visitData.referrer,
      visitData.page,
      sessionId
    );

    // Store anonymous visits in a special document
    await collection.updateOne(
      { msisdn: `session:${sessionId}` },
      {
        $setOnInsert: {
          msisdn: `session:${sessionId}`,
          normalizedMsisdn: `session:${sessionId}`,
          firstSeen: new Date(),
          bookmarks: [],
          favorites: [],
        },
        $set: { lastSeen: new Date() },
        $push: { visits: { $each: [visit], $slice: -50 } },
        $inc: { totalVisits: 1 },
      },
      { upsert: true }
    );
  }

  // Merge session visits with MSISDN user
  async mergeSession(sessionId: string, msisdn: string): Promise<void> {
    const collection = await this.getCollection();
    const normalizedMsisdn = normalizeMSISDN(msisdn);

    const sessionUser = await collection.findOne({ msisdn: `session:${sessionId}` });
    if (!sessionUser) return;

    const user = await collection.findOne({ normalizedMsisdn });

    if (user) {
      // Merge visits and bookmarks
      await collection.updateOne(
        { _id: user._id },
        {
          $push: { visits: { $each: sessionUser.visits, $slice: -100 } },
          $addToSet: {
            bookmarks: { $each: sessionUser.bookmarks },
            favorites: { $each: sessionUser.favorites },
          },
          $inc: { totalVisits: sessionUser.totalVisits },
        }
      );
    } else {
      // Convert session to real user
      await collection.updateOne(
        { _id: sessionUser._id },
        {
          $set: {
            msisdn,
            normalizedMsisdn,
          },
        }
      );
    }

    // Delete session document if merged
    if (user) {
      await collection.deleteOne({ msisdn: `session:${sessionId}` });
    }
  }

  // Add bookmark
  async addBookmark(msisdn: string, articleId: string): Promise<void> {
    const collection = await this.getCollection();
    const normalizedMsisdn = normalizeMSISDN(msisdn);
    await collection.updateOne(
      { normalizedMsisdn },
      { $addToSet: { bookmarks: articleId } }
    );
  }

  // Remove bookmark
  async removeBookmark(msisdn: string, articleId: string): Promise<void> {
    const collection = await this.getCollection();
    const normalizedMsisdn = normalizeMSISDN(msisdn);
    await collection.updateOne(
      { normalizedMsisdn },
      { $pull: { bookmarks: articleId } }
    );
  }

  // Add favorite
  async addFavorite(msisdn: string, articleId: string): Promise<void> {
    const collection = await this.getCollection();
    const normalizedMsisdn = normalizeMSISDN(msisdn);
    await collection.updateOne(
      { normalizedMsisdn },
      { $addToSet: { favorites: articleId } }
    );
  }

  // List users with filters (for admin)
  async listUsers(options: {
    page?: number;
    limit?: number;
    minVisits?: number;
    lastSeenAfter?: Date;
    search?: string;
  } = {}): Promise<{ users: User[]; total: number; pages: number }> {
    const collection = await this.getCollection();
    const { page = 1, limit = 20, minVisits, lastSeenAfter, search } = options;
    const skip = (page - 1) * limit;

    const filter: Filter<User> = {
      msisdn: { $not: { $regex: /^session:/ } }, // Exclude anonymous sessions
    };

    if (minVisits) filter.totalVisits = { $gte: minVisits };
    if (lastSeenAfter) filter.lastSeen = { $gte: lastSeenAfter };
    if (search) {
      filter.$or = [
        { msisdn: { $regex: search, $options: 'i' } },
        { normalizedMsisdn: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      collection.find(filter).sort({ lastSeen: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      users,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // Get heavy users (3+ visits)
  async getHeavyUsers(minVisits: number = 3): Promise<User[]> {
    const collection = await this.getCollection();
    return collection
      .find({
        totalVisits: { $gte: minVisits },
        msisdn: { $not: { $regex: /^session:/ } },
      })
      .sort({ totalVisits: -1 })
      .toArray();
  }

  // Export MSISDNs for remarketing
  async exportMsisdns(filter?: {
    minVisits?: number;
    lastSeenAfter?: Date;
    hasBookmarks?: boolean;
  }): Promise<string[]> {
    const collection = await this.getCollection();
    const query: Filter<User> = {
      msisdn: { $not: { $regex: /^session:/ } },
    };

    if (filter?.minVisits) query.totalVisits = { $gte: filter.minVisits };
    if (filter?.lastSeenAfter) query.lastSeen = { $gte: filter.lastSeenAfter };
    if (filter?.hasBookmarks) query['bookmarks.0'] = { $exists: true };

    const users = await collection
      .find(query, { projection: { normalizedMsisdn: 1 } })
      .toArray();

    return users.map(u => u.normalizedMsisdn);
  }
}

// Factory function to get repository for a brand
export function getUserRepository(brandId: string): UserRepository {
  return new UserRepository(brandId);
}
