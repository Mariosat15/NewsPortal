import { Collection, Filter, ObjectId } from 'mongodb';
import { getCollection } from '../mongodb';
import { User, UserCreateInput, createUser, createVisit, normalizeMSISDN, createEmailUser, createMSISDNUser, EmailUserCreateInput, MSISDNUserCreateInput } from '../models/user';

const COLLECTION_NAME = 'users';

export class UserRepository {
  private brandId: string;

  constructor(brandId: string) {
    this.brandId = brandId;
  }

  private async getCollection(): Promise<Collection<User>> {
    return getCollection<User>(this.brandId, COLLECTION_NAME);
  }

  // Create or update user by MSISDN (legacy method)
  async upsertByMsisdn(input: MSISDNUserCreateInput): Promise<User> {
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
          $set: { lastSeen: new Date(), updatedAt: new Date() },
          $push: { visits: { $each: [visit], $slice: -100 } }, // Keep last 100 visits
          $inc: { totalVisits: 1 },
        }
      );

      return (await collection.findOne({ _id: existing._id }))!;
    }

    // Create new user
    const user = createMSISDNUser(input);
    const result = await collection.insertOne(user as User);
    return { ...user, _id: result.insertedId };
  }

  // Create or update user (handles both email and MSISDN)
  async upsert(input: UserCreateInput): Promise<User> {
    // If input has email and passwordHash, use email auth
    if (input.email && input.passwordHash) {
      return this.upsertByEmail({
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name || '',
        ip: input.ip,
        userAgent: input.userAgent,
      });
    }
    
    // Otherwise, use MSISDN auth (must have msisdn)
    if (input.msisdn) {
      return this.upsertByMsisdn({
        msisdn: input.msisdn,
        ip: input.ip,
        userAgent: input.userAgent,
        referrer: input.referrer,
        page: input.page,
        sessionId: input.sessionId,
      });
    }

    throw new Error('Either email+passwordHash or msisdn must be provided');
  }

  // Create or update user by email
  async upsertByEmail(input: EmailUserCreateInput): Promise<User> {
    const collection = await this.getCollection();
    const email = input.email.toLowerCase();

    const existing = await collection.findOne({ email });

    if (existing) {
      // User exists, update last seen
      await collection.updateOne(
        { _id: existing._id },
        {
          $set: { 
            lastSeen: new Date(), 
            updatedAt: new Date(),
            // Update password if provided (for password reset)
            ...(input.passwordHash && { passwordHash: input.passwordHash }),
          },
        }
      );

      return (await collection.findOne({ _id: existing._id }))!;
    }

    // Create new user
    const user = createEmailUser(input);
    const result = await collection.insertOne(user as User);
    return { ...user, _id: result.insertedId };
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    const collection = await this.getCollection();
    return collection.findOne({ email: email.toLowerCase() });
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
          emailVerified: false,
          authProvider: 'msisdn' as const,
          isActive: true,
          createdAt: new Date(),
        },
        $set: { lastSeen: new Date(), updatedAt: new Date() },
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
  async addBookmark(userId: string | ObjectId, articleId: string): Promise<void> {
    const collection = await this.getCollection();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    await collection.updateOne(
      { _id: objectId },
      { $addToSet: { bookmarks: articleId } }
    );
  }

  // Remove bookmark
  async removeBookmark(userId: string | ObjectId, articleId: string): Promise<void> {
    const collection = await this.getCollection();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    await collection.updateOne(
      { _id: objectId },
      { $pull: { bookmarks: articleId } }
    );
  }

  // Add bookmark by MSISDN (legacy)
  async addBookmarkByMsisdn(msisdn: string, articleId: string): Promise<void> {
    const collection = await this.getCollection();
    const normalizedMsisdn = normalizeMSISDN(msisdn);
    await collection.updateOne(
      { normalizedMsisdn },
      { $addToSet: { bookmarks: articleId } }
    );
  }

  // Remove bookmark by MSISDN (legacy)
  async removeBookmarkByMsisdn(msisdn: string, articleId: string): Promise<void> {
    const collection = await this.getCollection();
    const normalizedMsisdn = normalizeMSISDN(msisdn);
    await collection.updateOne(
      { normalizedMsisdn },
      { $pull: { bookmarks: articleId } }
    );
  }

  // Add favorite
  async addFavorite(userId: string | ObjectId, articleId: string): Promise<void> {
    const collection = await this.getCollection();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    await collection.updateOne(
      { _id: objectId },
      { $addToSet: { favorites: articleId } }
    );
  }

  // Add favorite by MSISDN (legacy)
  async addFavoriteByMsisdn(msisdn: string, articleId: string): Promise<void> {
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
    authProvider?: 'email' | 'msisdn';
  } = {}): Promise<{ users: User[]; total: number; pages: number }> {
    const collection = await this.getCollection();
    const { page = 1, limit = 20, minVisits, lastSeenAfter, search, authProvider } = options;
    const skip = (page - 1) * limit;

    const filter: Filter<User> = {
      // Include email users (no msisdn) and MSISDN users that aren't anonymous sessions
      $or: [
        { msisdn: { $exists: false } },
        { msisdn: { $not: { $regex: /^session:/ } } }
      ]
    };

    if (minVisits) filter.totalVisits = { $gte: minVisits };
    if (lastSeenAfter) filter.lastSeen = { $gte: lastSeenAfter };
    if (authProvider) filter.authProvider = authProvider;
    if (search) {
      filter.$or = [
        { msisdn: { $regex: search, $options: 'i' } },
        { normalizedMsisdn: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
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
        $or: [
          { msisdn: { $exists: false } },
          { msisdn: { $not: { $regex: /^session:/ } } }
        ],
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
      authProvider: 'msisdn',
      normalizedMsisdn: { $exists: true },
    };

    if (filter?.minVisits) query.totalVisits = { $gte: filter.minVisits };
    if (filter?.lastSeenAfter) query.lastSeen = { $gte: filter.lastSeenAfter };
    if (filter?.hasBookmarks) query['bookmarks.0'] = { $exists: true };

    const users = await collection
      .find(query, { projection: { normalizedMsisdn: 1 } })
      .toArray();

    return users.filter(u => u.normalizedMsisdn).map(u => u.normalizedMsisdn!);
  }

  // Update user by ID (for admin operations)
  async updateById(id: string | ObjectId, updates: {
    name?: string;
    isActive?: boolean;
    emailVerified?: boolean;
  }): Promise<User | null> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;

    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updates.name !== undefined) updateFields.name = updates.name;
    if (updates.isActive !== undefined) updateFields.isActive = updates.isActive;
    if (updates.emailVerified !== undefined) updateFields.emailVerified = updates.emailVerified;

    await collection.updateOne(
      { _id: objectId },
      { $set: updateFields }
    );

    return collection.findOne({ _id: objectId });
  }

  // Ban/suspend user
  async banUser(id: string | ObjectId): Promise<User | null> {
    return this.updateById(id, { isActive: false });
  }

  // Unban/reactivate user
  async unbanUser(id: string | ObjectId): Promise<User | null> {
    return this.updateById(id, { isActive: true });
  }

  // Add a visit record to existing user (by normalized MSISDN)
  async addVisit(normalizedMsisdn: string, visitData: {
    ip: string;
    userAgent: string;
    referrer: string;
    page: string;
    sessionId: string;
  }): Promise<void> {
    const collection = await this.getCollection();
    const visit = createVisit(
      visitData.ip,
      visitData.userAgent,
      visitData.referrer,
      visitData.page,
      visitData.sessionId
    );

    await collection.updateOne(
      { normalizedMsisdn },
      {
        $set: { lastSeen: new Date(), updatedAt: new Date() },
        $push: { visits: { $each: [visit], $slice: -100 } },
        $inc: { totalVisits: 1 },
      }
    );
  }

  // Add landing page visit to user
  async addLandingPageVisit(normalizedMsisdn: string, visitData: {
    landingPageSlug: string;
    landingPageId?: string;
    utm?: {
      source?: string;
      medium?: string;
      campaign?: string;
      content?: string;
      term?: string;
    };
  }): Promise<void> {
    const collection = await this.getCollection();
    
    const lpVisit = {
      landingPageSlug: visitData.landingPageSlug,
      landingPageId: visitData.landingPageId,
      timestamp: new Date(),
      utm: visitData.utm,
    };

    await collection.updateOne(
      { normalizedMsisdn },
      {
        $set: { 
          lastSeen: new Date(), 
          updatedAt: new Date(),
          lastLandingPage: visitData.landingPageSlug,
        },
        $push: { landingPageVisits: { $each: [lpVisit], $slice: -50 } },
      }
    );
  }

  // Create new user with full MSISDN input
  async createMsisdnUser(input: MSISDNUserCreateInput): Promise<User> {
    const collection = await this.getCollection();
    const user = createMSISDNUser(input);
    const result = await collection.insertOne(user as User);
    return { ...user, _id: result.insertedId };
  }

  // Update user to customer status after purchase
  async convertToCustomer(normalizedMsisdn: string, purchaseAmount: number): Promise<void> {
    const collection = await this.getCollection();
    const now = new Date();

    await collection.updateOne(
      { normalizedMsisdn },
      {
        $set: {
          status: 'customer',
          lastSeen: now,
          updatedAt: now,
          lastPurchaseAt: now,
          msisdnConfirmedAt: now,
        },
        $setOnInsert: { firstPurchaseAt: now },
        $inc: { 
          totalPurchases: 1,
          totalSpent: purchaseAmount,
        },
      }
    );
  }

  // Get users by status
  async listByStatus(status: 'visitor' | 'identified' | 'customer', options: {
    page?: number;
    limit?: number;
    landingPageSlug?: string;
  } = {}): Promise<{ users: User[]; total: number }> {
    const collection = await this.getCollection();
    const { page = 1, limit = 20, landingPageSlug } = options;
    const skip = (page - 1) * limit;

    const filter: Filter<User> = { status };
    if (landingPageSlug) {
      filter.$or = [
        { firstLandingPage: landingPageSlug },
        { 'landingPageVisits.landingPageSlug': landingPageSlug },
      ];
    }

    const [users, total] = await Promise.all([
      collection.find(filter).sort({ lastSeen: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);

    return { users, total };
  }

  // Get landing page stats
  async getLandingPageStats(landingPageSlug: string): Promise<{
    visitors: number;
    identified: number;
    customers: number;
    totalVisits: number;
  }> {
    const collection = await this.getCollection();

    const stats = await collection.aggregate([
      {
        $match: {
          $or: [
            { firstLandingPage: landingPageSlug },
            { 'landingPageVisits.landingPageSlug': landingPageSlug },
          ],
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalVisits: { $sum: '$totalVisits' },
        },
      },
    ]).toArray();

    const result = {
      visitors: 0,
      identified: 0,
      customers: 0,
      totalVisits: 0,
    };

    for (const stat of stats) {
      if (stat._id === 'visitor') result.visitors = stat.count;
      else if (stat._id === 'identified') result.identified = stat.count;
      else if (stat._id === 'customer') result.customers = stat.count;
      result.totalVisits += stat.totalVisits;
    }

    return result;
  }
}

// Factory function to get repository for a brand
export function getUserRepository(brandId: string): UserRepository {
  return new UserRepository(brandId);
}
