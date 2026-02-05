import { Collection } from 'mongodb';
import { getCollection } from '../mongodb';
import {
  Customer,
  CustomerCreateInput,
  CustomerUpdateInput,
  CustomerSearchParams,
  CustomerExportParams,
  CustomerSession,
} from '../models/customer';
import { normalizePhoneNumber } from '@/lib/utils/phone';

export class CustomerRepository {
  private brandId: string;
  private collectionPromise: Promise<Collection<Customer>>;

  constructor(brandId: string) {
    this.brandId = brandId;
    this.collectionPromise = this.initCollection();
  }

  private async initCollection(): Promise<Collection<Customer>> {
    const collection = await getCollection<Customer>(this.brandId, 'customers');
    
    await collection.createIndex({ tenantId: 1 });
    await collection.createIndex({ lastSeenAt: -1 });
    await collection.createIndex({ totalVisits: -1 });
    await collection.createIndex({ heavyUserFlag: 1 });
    await collection.createIndex({ topCampaign: 1 }, { sparse: true });
    await collection.createIndex({ topSource: 1 }, { sparse: true });
    await collection.createIndex({ 'sessions.sessionId': 1 });
    
    return collection;
  }

  private async getCollection(): Promise<Collection<Customer>> {
    return this.collectionPromise;
  }

  async create(input: CustomerCreateInput): Promise<Customer> {
    const collection = await this.getCollection();
    const now = new Date();
    const normalizedMsisdn = input.normalizedMsisdn || normalizePhoneNumber(input.msisdn);

    const session: CustomerSession | undefined = input.sessionId ? {
      sessionId: input.sessionId,
      firstSeenAt: now,
      lastSeenAt: now,
      landingPageSlug: input.landingPageSlug,
      campaign: input.campaign,
      source: input.source,
    } : undefined;

    const customer: Customer = {
      _id: normalizedMsisdn,
      msisdn: input.msisdn,
      tenantId: input.tenantId,
      // Conversion tracking
      conversionStatus: input.conversionStatus || 'visitor',
      firstLandingPage: input.landingPageSlug,
      lastLandingPage: input.landingPageSlug,
      landingPagesVisited: input.landingPageSlug ? [input.landingPageSlug] : [],
      // Carrier info
      carrier: input.carrier,
      country: input.country,
      // User account link
      userId: input.userId,
      userEmail: input.userEmail,
      userName: input.userName,
      // Timestamps
      firstSeenAt: now,
      lastSeenAt: now,
      totalVisits: 1,
      visitsLast30d: 1,
      heavyUserFlag: false,
      topCampaign: input.campaign,
      topSource: input.source,
      sessions: session ? [session] : [],
      // Billing
      totalBillingAmount: 0,
      totalPurchases: 0,
      repurchaseCount: 0,
      averagePurchaseValue: 0,
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(customer);
    return customer;
  }

  async findByMsisdn(normalizedMsisdn: string): Promise<Customer | null> {
    const collection = await this.getCollection();
    return collection.findOne({ _id: normalizedMsisdn });
  }

  async findByRawMsisdn(msisdn: string): Promise<Customer | null> {
    const normalizedMsisdn = normalizePhoneNumber(msisdn);
    return this.findByMsisdn(normalizedMsisdn);
  }

  async upsert(input: CustomerCreateInput): Promise<Customer> {
    const collection = await this.getCollection();
    const normalizedMsisdn = input.normalizedMsisdn || normalizePhoneNumber(input.msisdn);
    const now = new Date();

    const existing = await this.findByMsisdn(normalizedMsisdn);
    
    if (existing) {
      // Update existing customer
      const newSession: CustomerSession | undefined = input.sessionId ? {
        sessionId: input.sessionId,
        firstSeenAt: now,
        lastSeenAt: now,
        landingPageSlug: input.landingPageSlug,
        campaign: input.campaign,
        source: input.source,
      } : undefined;

      const updateOps: Record<string, unknown> = {
        $set: {
          lastSeenAt: now,
          updatedAt: now,
        },
        $inc: {
          totalVisits: 1,
          visitsLast30d: 1,
        },
      };

      // Add session if not already exists
      if (newSession) {
        const sessionExists = existing.sessions.some(s => s.sessionId === input.sessionId);
        if (!sessionExists) {
          updateOps.$push = { sessions: { $each: [newSession], $slice: -100 } }; // Keep last 100 sessions
        }
      }

      // Update heavy user flag
      const newTotalVisits = existing.totalVisits + 1;
      if (newTotalVisits >= 3 && !existing.heavyUserFlag) {
        (updateOps.$set as Record<string, unknown>).heavyUserFlag = true;
      }

      // Update top campaign/source if provided
      if (input.campaign) {
        (updateOps.$set as Record<string, unknown>).topCampaign = input.campaign;
      }
      if (input.source) {
        (updateOps.$set as Record<string, unknown>).topSource = input.source;
      }
      
      // Update user account link if provided (and not already set)
      if (input.userId && !existing.userId) {
        (updateOps.$set as Record<string, unknown>).userId = input.userId;
      }
      if (input.userEmail && !existing.userEmail) {
        (updateOps.$set as Record<string, unknown>).userEmail = input.userEmail;
      }
      if (input.userName && !existing.userName) {
        (updateOps.$set as Record<string, unknown>).userName = input.userName;
      }

      await collection.updateOne({ _id: normalizedMsisdn }, updateOps);
      return (await this.findByMsisdn(normalizedMsisdn))!;
    }

    return this.create(input);
  }

  async update(normalizedMsisdn: string, input: CustomerUpdateInput): Promise<Customer | null> {
    const collection = await this.getCollection();

    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.lastSeenAt) updateFields.lastSeenAt = input.lastSeenAt;
    if (input.totalVisits !== undefined) updateFields.totalVisits = input.totalVisits;
    if (input.visitsLast30d !== undefined) updateFields.visitsLast30d = input.visitsLast30d;
    if (input.heavyUserFlag !== undefined) updateFields.heavyUserFlag = input.heavyUserFlag;
    if (input.topCampaign) updateFields.topCampaign = input.topCampaign;
    if (input.topSource) updateFields.topSource = input.topSource;
    if (input.totalBillingAmount !== undefined) updateFields.totalBillingAmount = input.totalBillingAmount;
    if (input.totalPurchases !== undefined) updateFields.totalPurchases = input.totalPurchases;
    if (input.lastBillingDate) updateFields.lastBillingDate = input.lastBillingDate;
    if (input.userId) updateFields.userId = input.userId;
    if (input.userEmail) updateFields.userEmail = input.userEmail;
    if (input.userName) updateFields.userName = input.userName;
    if (input.notes !== undefined) updateFields.notes = input.notes;
    if (input.tags) updateFields.tags = input.tags;

    const result = await collection.findOneAndUpdate(
      { _id: normalizedMsisdn },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return result;
  }

  async addBillingAmount(normalizedMsisdn: string, amount: number, userInfo?: { userId?: string; userEmail?: string }): Promise<Customer | null> {
    const collection = await this.getCollection();
    
    const updateOps: Record<string, unknown> = {
      $inc: { totalBillingAmount: amount, totalPurchases: 1 },
      $set: { 
        lastBillingDate: new Date(),
        updatedAt: new Date(),
      },
    };
    
    // Also update user link if provided
    if (userInfo?.userId) {
      (updateOps.$set as Record<string, unknown>).userId = userInfo.userId;
    }
    if (userInfo?.userEmail) {
      (updateOps.$set as Record<string, unknown>).userEmail = userInfo.userEmail;
    }
    
    const result = await collection.findOneAndUpdate(
      { _id: normalizedMsisdn },
      updateOps,
      { returnDocument: 'after' }
    );

    return result;
  }

  async updateNotes(normalizedMsisdn: string, notes: string): Promise<Customer | null> {
    return this.update(normalizedMsisdn, { notes });
  }

  async search(params: CustomerSearchParams): Promise<{ customers: Customer[]; total: number }> {
    const collection = await this.getCollection();
    const { 
      msisdn, tenantId, heavyUserOnly, minVisits, 
      dateFrom, dateTo, campaign, source,
      page = 1, limit = 50 
    } = params;

    const query: Record<string, unknown> = {};

    if (msisdn) {
      // Support partial match
      query.$or = [
        { _id: { $regex: msisdn, $options: 'i' } },
        { msisdn: { $regex: msisdn, $options: 'i' } },
      ];
    }
    if (tenantId) query.tenantId = tenantId;
    if (heavyUserOnly) query.heavyUserFlag = true;
    if (minVisits) query.totalVisits = { $gte: minVisits };
    if (campaign) query.topCampaign = campaign;
    if (source) query.topSource = source;
    
    if (dateFrom || dateTo) {
      query.lastSeenAt = {};
      if (dateFrom) (query.lastSeenAt as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (query.lastSeenAt as Record<string, Date>).$lte = dateTo;
    }

    const [customers, total] = await Promise.all([
      collection
        .find(query)
        .sort({ lastSeenAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ]);

    return { customers, total };
  }

  async getHeavyUsers(params: CustomerExportParams): Promise<Customer[]> {
    const collection = await this.getCollection();
    const { tenantId, dateFrom, dateTo, minVisits, campaign, source } = params;

    const query: Record<string, unknown> = {
      totalVisits: { $gte: minVisits },
    };

    if (tenantId) query.tenantId = tenantId;
    if (campaign) query.topCampaign = campaign;
    if (source) query.topSource = source;
    
    query.lastSeenAt = { $gte: dateFrom, $lte: dateTo };

    return collection
      .find(query)
      .sort({ totalVisits: -1, lastSeenAt: -1 })
      .toArray();
  }

  async getStats(tenantId?: string): Promise<{
    totalCustomers: number;
    heavyUsers: number;
    activeLastWeek: number;
    activeLastMonth: number;
    totalBillingAmount: number;
  }> {
    const collection = await this.getCollection();
    
    const matchStage: Record<string, unknown> = {};
    if (tenantId) matchStage.tenantId = tenantId;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = await collection.aggregate<{
      _id: null;
      totalCustomers: number;
      heavyUsers: number;
      activeLastWeek: number;
      activeLastMonth: number;
      totalBillingAmount: number;
    }>([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          heavyUsers: { $sum: { $cond: ['$heavyUserFlag', 1, 0] } },
          activeLastWeek: { $sum: { $cond: [{ $gte: ['$lastSeenAt', weekAgo] }, 1, 0] } },
          activeLastMonth: { $sum: { $cond: [{ $gte: ['$lastSeenAt', monthAgo] }, 1, 0] } },
          totalBillingAmount: { $sum: '$totalBillingAmount' },
        },
      },
    ]).toArray();

    const defaultStats = {
      totalCustomers: 0,
      heavyUsers: 0,
      activeLastWeek: 0,
      activeLastMonth: 0,
      totalBillingAmount: 0,
    };

    if (stats[0]) {
      return {
        totalCustomers: stats[0].totalCustomers,
        heavyUsers: stats[0].heavyUsers,
        activeLastWeek: stats[0].activeLastWeek,
        activeLastMonth: stats[0].activeLastMonth,
        totalBillingAmount: stats[0].totalBillingAmount,
      };
    }
    return defaultStats;
  }

  async recalculateVisitsLast30d(): Promise<number> {
    const collection = await this.getCollection();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // This is a simplified version - in production, you'd aggregate from sessions
    const result = await collection.updateMany(
      {},
      [
        {
          $set: {
            visitsLast30d: {
              $size: {
                $filter: {
                  input: '$sessions',
                  as: 'session',
                  cond: { $gte: ['$$session.lastSeenAt', thirtyDaysAgo] }
                }
              }
            }
          }
        }
      ]
    );

    return result.modifiedCount;
  }

  // Upsert an identified user (MSISDN detected but not yet a customer)
  async upsertIdentified(input: CustomerCreateInput): Promise<Customer> {
    const collection = await this.getCollection();
    const normalizedMsisdn = input.normalizedMsisdn || normalizePhoneNumber(input.msisdn);
    const now = new Date();

    const existing = await this.findByMsisdn(normalizedMsisdn);
    
    if (existing) {
      // Update existing - only update lastSeenAt and add landing page if new
      const updateOps: Record<string, unknown> = {
        $set: {
          lastSeenAt: now,
          updatedAt: now,
        },
        $inc: { totalVisits: 1 },
      };

      // Add landing page to list if not already there
      if (input.landingPageSlug && !existing.landingPagesVisited?.includes(input.landingPageSlug)) {
        updateOps.$addToSet = { landingPagesVisited: input.landingPageSlug };
        (updateOps.$set as Record<string, unknown>).lastLandingPage = input.landingPageSlug;
      }

      // Update carrier/country if not set
      if (input.carrier && !existing.carrier) {
        (updateOps.$set as Record<string, unknown>).carrier = input.carrier;
      }
      if (input.country && !existing.country) {
        (updateOps.$set as Record<string, unknown>).country = input.country;
      }

      await collection.updateOne({ _id: normalizedMsisdn }, updateOps);
      return (await this.findByMsisdn(normalizedMsisdn))!;
    }

    // Create new identified customer
    const customer: Customer = {
      _id: normalizedMsisdn,
      msisdn: input.msisdn,
      tenantId: input.tenantId,
      conversionStatus: input.conversionStatus || 'identified',
      identifiedAt: now,
      firstLandingPage: input.landingPageSlug,
      lastLandingPage: input.landingPageSlug,
      landingPagesVisited: input.landingPageSlug ? [input.landingPageSlug] : [],
      carrier: input.carrier,
      country: input.country,
      userId: input.userId,
      userEmail: input.userEmail,
      userName: input.userName,
      firstSeenAt: now,
      lastSeenAt: now,
      totalVisits: 1,
      visitsLast30d: 1,
      heavyUserFlag: false,
      topCampaign: input.campaign,
      topSource: input.source,
      sessions: input.sessionId ? [{
        sessionId: input.sessionId,
        firstSeenAt: now,
        lastSeenAt: now,
        landingPageSlug: input.landingPageSlug,
        campaign: input.campaign,
        source: input.source,
      }] : [],
      totalBillingAmount: 0,
      totalPurchases: 0,
      repurchaseCount: 0,
      averagePurchaseValue: 0,
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(customer);
    return customer;
  }

  // Record a visit for an existing customer
  async recordVisit(normalizedMsisdn: string, visitData: {
    sessionId: string;
    landingPageSlug?: string;
    campaign?: string;
    source?: string;
  }): Promise<void> {
    const collection = await this.getCollection();
    const now = new Date();

    const updateOps: Record<string, unknown> = {
      $set: {
        lastSeenAt: now,
        updatedAt: now,
      },
      $inc: { totalVisits: 1, visitsLast30d: 1 },
    };

    // Add landing page if provided
    if (visitData.landingPageSlug) {
      updateOps.$addToSet = { landingPagesVisited: visitData.landingPageSlug };
      (updateOps.$set as Record<string, unknown>).lastLandingPage = visitData.landingPageSlug;
    }

    // Update campaign/source if provided
    if (visitData.campaign) {
      (updateOps.$set as Record<string, unknown>).topCampaign = visitData.campaign;
    }
    if (visitData.source) {
      (updateOps.$set as Record<string, unknown>).topSource = visitData.source;
    }

    await collection.updateOne({ _id: normalizedMsisdn }, updateOps);
  }

  // Convert identified user to customer after purchase
  async convertToCustomer(normalizedMsisdn: string, purchaseAmount: number): Promise<Customer | null> {
    const collection = await this.getCollection();
    const now = new Date();

    const existing = await this.findByMsisdn(normalizedMsisdn);
    const isFirstPurchase = !existing?.convertedAt;
    const newTotalPurchases = (existing?.totalPurchases || 0) + 1;
    const newTotalAmount = (existing?.totalBillingAmount || 0) + purchaseAmount;

    const updateOps: Record<string, unknown> = {
      $set: {
        conversionStatus: 'customer',
        lastSeenAt: now,
        updatedAt: now,
        lastPurchaseDate: now,
        lastBillingDate: now,
        averagePurchaseValue: Math.round(newTotalAmount / newTotalPurchases),
      },
      $inc: {
        totalPurchases: 1,
        totalBillingAmount: purchaseAmount,
        repurchaseCount: isFirstPurchase ? 0 : 1,
      },
    };

    // Set first purchase date if this is the first purchase
    if (isFirstPurchase) {
      (updateOps.$set as Record<string, unknown>).convertedAt = now;
      (updateOps.$set as Record<string, unknown>).firstPurchaseDate = now;
    }

    await collection.updateOne({ _id: normalizedMsisdn }, updateOps);
    return this.findByMsisdn(normalizedMsisdn);
  }

  // Get landing page statistics
  async getLandingPageStats(landingPageSlug: string, tenantId?: string): Promise<{
    totalVisitors: number;
    identifiedUsers: number;
    customers: number;
    totalRevenue: number;
    conversionRate: number;
    repurchaseRate: number;
    averageOrderValue: number;
  }> {
    const collection = await this.getCollection();

    const matchStage: Record<string, unknown> = {
      landingPagesVisited: landingPageSlug,
    };
    if (tenantId) matchStage.tenantId = tenantId;

    const stats = await collection.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalVisitors: { $sum: 1 },
          identifiedUsers: {
            $sum: { $cond: [{ $eq: ['$conversionStatus', 'identified'] }, 1, 0] },
          },
          customers: {
            $sum: { $cond: [{ $eq: ['$conversionStatus', 'customer'] }, 1, 0] },
          },
          totalRevenue: { $sum: '$totalBillingAmount' },
          totalPurchases: { $sum: '$totalPurchases' },
          totalRepurchases: { $sum: '$repurchaseCount' },
        },
      },
    ]).toArray();

    if (!stats[0]) {
      return {
        totalVisitors: 0,
        identifiedUsers: 0,
        customers: 0,
        totalRevenue: 0,
        conversionRate: 0,
        repurchaseRate: 0,
        averageOrderValue: 0,
      };
    }

    const { totalVisitors, identifiedUsers, customers, totalRevenue, totalPurchases, totalRepurchases } = stats[0];

    return {
      totalVisitors,
      identifiedUsers,
      customers,
      totalRevenue,
      conversionRate: totalVisitors > 0 ? (customers / totalVisitors) * 100 : 0,
      repurchaseRate: totalPurchases > 0 ? (totalRepurchases / totalPurchases) * 100 : 0,
      averageOrderValue: totalPurchases > 0 ? Math.round(totalRevenue / totalPurchases) : 0,
    };
  }

  // Get all landing page stats for admin dashboard
  async getAllLandingPageStats(tenantId?: string): Promise<Array<{
    landingPageSlug: string;
    visitors: number;
    customers: number;
    revenue: number;
    conversionRate: number;
  }>> {
    const collection = await this.getCollection();

    const matchStage: Record<string, unknown> = {};
    if (tenantId) matchStage.tenantId = tenantId;

    const stats = await collection.aggregate([
      { $match: matchStage },
      { $unwind: { path: '$landingPagesVisited', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: '$landingPagesVisited',
          visitors: { $sum: 1 },
          customers: {
            $sum: { $cond: [{ $eq: ['$conversionStatus', 'customer'] }, 1, 0] },
          },
          revenue: { $sum: '$totalBillingAmount' },
        },
      },
      {
        $project: {
          landingPageSlug: '$_id',
          visitors: 1,
          customers: 1,
          revenue: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$visitors', 0] },
              { $multiply: [{ $divide: ['$customers', '$visitors'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { visitors: -1 } },
    ]).toArray();

    return stats.map(s => ({
      landingPageSlug: s.landingPageSlug,
      visitors: s.visitors,
      customers: s.customers,
      revenue: s.revenue,
      conversionRate: Math.round(s.conversionRate * 10) / 10,
    }));
  }

  // Get customers by conversion status
  async listByConversionStatus(
    status: 'visitor' | 'identified' | 'customer',
    options: { page?: number; limit?: number; landingPageSlug?: string } = {}
  ): Promise<{ customers: Customer[]; total: number }> {
    const collection = await this.getCollection();
    const { page = 1, limit = 20, landingPageSlug } = options;

    const query: Record<string, unknown> = { conversionStatus: status };
    if (landingPageSlug) {
      query.landingPagesVisited = landingPageSlug;
    }

    const [customers, total] = await Promise.all([
      collection.find(query).sort({ lastSeenAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      collection.countDocuments(query),
    ]);

    return { customers, total };
  }
}

// Factory function
let repositories: Map<string, CustomerRepository> = new Map();

export function getCustomerRepository(brandId: string): CustomerRepository {
  if (!repositories.has(brandId)) {
    repositories.set(brandId, new CustomerRepository(brandId));
  }
  return repositories.get(brandId)!;
}
