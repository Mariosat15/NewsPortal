import { Collection, ObjectId } from 'mongodb';
import { getCollection } from '../mongodb';
import {
  VisitorSession,
  VisitorSessionCreateInput,
  VisitorSessionUpdateInput,
} from '../models/visitor-session';
import {
  TrackingEvent,
  TrackingEventCreateInput,
  TrackingEventType,
} from '../models/tracking-event';

export class TrackingRepository {
  private brandId: string;
  private sessionsPromise: Promise<Collection<VisitorSession>>;
  private eventsPromise: Promise<Collection<TrackingEvent>>;

  constructor(brandId: string) {
    this.brandId = brandId;
    this.sessionsPromise = this.initSessionsCollection();
    this.eventsPromise = this.initEventsCollection();
  }

  private async initSessionsCollection(): Promise<Collection<VisitorSession>> {
    const collection = await getCollection<VisitorSession>(this.brandId, 'visitor_sessions');
    
    await collection.createIndex({ sessionId: 1 }, { unique: true });
    await collection.createIndex({ normalizedMsisdn: 1 }, { sparse: true });
    await collection.createIndex({ tenantId: 1, firstSeenAt: -1 });
    await collection.createIndex({ lastSeenAt: -1 });
    await collection.createIndex({ msisdnConfidence: 1 });
    await collection.createIndex({ landingPageId: 1 });
    
    return collection;
  }

  private async initEventsCollection(): Promise<Collection<TrackingEvent>> {
    const collection = await getCollection<TrackingEvent>(this.brandId, 'tracking_events');
    
    await collection.createIndex({ sessionId: 1, timestamp: -1 });
    await collection.createIndex({ normalizedMsisdn: 1, timestamp: -1 }, { sparse: true });
    await collection.createIndex({ tenantId: 1, type: 1, timestamp: -1 });
    await collection.createIndex({ timestamp: -1 });
    await collection.createIndex({ type: 1 });
    
    return collection;
  }

  // Session methods
  async createSession(input: VisitorSessionCreateInput): Promise<VisitorSession> {
    const collection = await this.sessionsPromise;
    const now = new Date();

    const session: VisitorSession = {
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      landingPageId: input.landingPageId,
      landingPageSlug: input.landingPageSlug,
      firstSeenAt: now,
      lastSeenAt: now,
      ip: input.ip,
      userAgent: input.userAgent,
      device: input.device,
      referrer: input.referrer,
      utm: input.utm || {},
      msisdnConfidence: 'NONE',
      networkType: 'UNKNOWN',
      pageViews: 1,
      events: 0,
      enteredPortal: false,
    };

    const result = await collection.insertOne(session);
    return { ...session, _id: result.insertedId };
  }

  async findSession(sessionId: string): Promise<VisitorSession | null> {
    const collection = await this.sessionsPromise;
    return collection.findOne({ sessionId });
  }

  async updateSession(sessionId: string, input: VisitorSessionUpdateInput): Promise<VisitorSession | null> {
    const collection = await this.sessionsPromise;

    const updateFields: Record<string, unknown> = {};
    
    if (input.lastSeenAt) updateFields.lastSeenAt = input.lastSeenAt;
    if (input.msisdn) updateFields.msisdn = input.msisdn;
    if (input.normalizedMsisdn) updateFields.normalizedMsisdn = input.normalizedMsisdn;
    if (input.msisdnConfidence) updateFields.msisdnConfidence = input.msisdnConfidence;
    if (input.networkType) updateFields.networkType = input.networkType;
    if (input.carrier) updateFields.carrier = input.carrier;
    if (input.carrierCode) updateFields.carrierCode = input.carrierCode;
    if (input.lastPageUrl) updateFields.lastPageUrl = input.lastPageUrl;
    if (input.enteredPortal !== undefined) updateFields.enteredPortal = input.enteredPortal;
    if (input.purchaseCompleted !== undefined) updateFields.purchaseCompleted = input.purchaseCompleted;

    const updateOps: Record<string, unknown> = { $set: updateFields };
    
    if (input.pageViews) {
      updateOps.$inc = { ...(updateOps.$inc as object || {}), pageViews: input.pageViews };
    }
    if (input.events) {
      updateOps.$inc = { ...(updateOps.$inc as object || {}), events: input.events };
    }

    const result = await collection.findOneAndUpdate(
      { sessionId },
      updateOps,
      { returnDocument: 'after' }
    );

    return result;
  }

  async getOrCreateSession(input: VisitorSessionCreateInput): Promise<VisitorSession> {
    const existing = await this.findSession(input.sessionId);
    if (existing) {
      // Update last seen and increment page views
      const updated = await this.updateSession(input.sessionId, {
        lastSeenAt: new Date(),
        pageViews: 1,
      });
      return updated || existing;
    }
    return this.createSession(input);
  }

  async setSessionMsisdn(
    sessionId: string,
    msisdn: string,
    normalizedMsisdn: string,
    confidence: 'CONFIRMED' | 'UNCONFIRMED',
    carrier?: string,
    carrierCode?: string
  ): Promise<VisitorSession | null> {
    return this.updateSession(sessionId, {
      msisdn,
      normalizedMsisdn,
      msisdnConfidence: confidence,
      carrier,
      carrierCode,
    });
  }

  // Find recent sessions by IP (for linking MSISDN after purchase)
  async findRecentSessionsByIp(ip: string, hoursBack: number = 24): Promise<VisitorSession[]> {
    const collection = await this.sessionsPromise;
    const cutoffDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    
    return collection
      .find({
        ip,
        firstSeenAt: { $gte: cutoffDate },
      })
      .sort({ lastSeenAt: -1 })
      .limit(10)
      .toArray();
  }

  // Event methods
  async createEvent(input: TrackingEventCreateInput): Promise<TrackingEvent> {
    const collection = await this.eventsPromise;
    const sessionsCollection = await this.sessionsPromise;

    const event: TrackingEvent = {
      sessionId: input.sessionId,
      tenantId: input.tenantId,
      msisdn: input.msisdn,
      normalizedMsisdn: input.normalizedMsisdn,
      type: input.type,
      metadata: input.metadata || {},
      timestamp: new Date(),
      ip: input.ip,
      userAgent: input.userAgent,
    };

    const result = await collection.insertOne(event);
    
    // Update session event count
    await sessionsCollection.updateOne(
      { sessionId: input.sessionId },
      { 
        $inc: { events: 1 },
        $set: { lastSeenAt: new Date() }
      }
    );

    return { ...event, _id: result.insertedId };
  }

  async getSessionEvents(sessionId: string, limit: number = 100): Promise<TrackingEvent[]> {
    const collection = await this.eventsPromise;
    return collection
      .find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  async getEventsByMsisdn(normalizedMsisdn: string, params: {
    dateFrom?: Date;
    dateTo?: Date;
    types?: TrackingEventType[];
    limit?: number;
  } = {}): Promise<TrackingEvent[]> {
    const collection = await this.eventsPromise;
    const { dateFrom, dateTo, types, limit = 100 } = params;

    const query: Record<string, unknown> = { normalizedMsisdn };
    
    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) (query.timestamp as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (query.timestamp as Record<string, Date>).$lte = dateTo;
    }
    
    if (types && types.length > 0) {
      query.type = { $in: types };
    }

    return collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  // Backfill MSISDN for session events
  async backfillMsisdn(sessionId: string, msisdn: string, normalizedMsisdn: string): Promise<number> {
    const collection = await this.eventsPromise;
    
    const result = await collection.updateMany(
      { sessionId, normalizedMsisdn: { $exists: false } },
      { $set: { msisdn, normalizedMsisdn } }
    );

    return result.modifiedCount;
  }

  // Analytics methods
  async getSessionStats(tenantId: string, params: {
    dateFrom?: Date;
    dateTo?: Date;
  } = {}): Promise<{
    totalSessions: number;
    msisdnConfirmed: number;
    mobileData: number;
    wifi: number;
    enteredPortal: number;
  }> {
    const collection = await this.sessionsPromise;
    const { dateFrom, dateTo } = params;

    const matchStage: Record<string, unknown> = { tenantId };
    if (dateFrom || dateTo) {
      matchStage.firstSeenAt = {};
      if (dateFrom) (matchStage.firstSeenAt as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (matchStage.firstSeenAt as Record<string, Date>).$lte = dateTo;
    }

    interface SessionStats {
      _id: null;
      totalSessions: number;
      msisdnConfirmed: number;
      mobileData: number;
      wifi: number;
      enteredPortal: number;
    }

    const stats = await collection.aggregate<SessionStats>([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          msisdnConfirmed: {
            $sum: { $cond: [{ $eq: ['$msisdnConfidence', 'CONFIRMED'] }, 1, 0] }
          },
          mobileData: {
            $sum: { $cond: [{ $eq: ['$networkType', 'MOBILE_DATA'] }, 1, 0] }
          },
          wifi: {
            $sum: { $cond: [{ $eq: ['$networkType', 'WIFI'] }, 1, 0] }
          },
          enteredPortal: {
            $sum: { $cond: ['$enteredPortal', 1, 0] }
          },
        },
      },
    ]).toArray();

    const defaultStats = {
      totalSessions: 0,
      msisdnConfirmed: 0,
      mobileData: 0,
      wifi: 0,
      enteredPortal: 0,
    };

    if (stats[0]) {
      return {
        totalSessions: stats[0].totalSessions,
        msisdnConfirmed: stats[0].msisdnConfirmed,
        mobileData: stats[0].mobileData,
        wifi: stats[0].wifi,
        enteredPortal: stats[0].enteredPortal,
      };
    }
    return defaultStats;
  }

  async getSessionsByMsisdn(normalizedMsisdn: string): Promise<VisitorSession[]> {
    const collection = await this.sessionsPromise;
    return collection
      .find({ normalizedMsisdn })
      .sort({ lastSeenAt: -1 })
      .toArray();
  }

  async listSessions(params: {
    tenantId?: string;
    msisdnConfidence?: 'CONFIRMED' | 'UNCONFIRMED' | 'NONE';
    networkType?: 'MOBILE_DATA' | 'WIFI' | 'UNKNOWN';
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{ sessions: VisitorSession[]; total: number }> {
    const collection = await this.sessionsPromise;
    const { tenantId, msisdnConfidence, networkType, dateFrom, dateTo, page = 1, limit = 50 } = params;

    const query: Record<string, unknown> = {};
    if (tenantId) query.tenantId = tenantId;
    if (msisdnConfidence) query.msisdnConfidence = msisdnConfidence;
    if (networkType) query.networkType = networkType;
    if (dateFrom || dateTo) {
      query.firstSeenAt = {};
      if (dateFrom) (query.firstSeenAt as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (query.firstSeenAt as Record<string, Date>).$lte = dateTo;
    }

    const [sessions, total] = await Promise.all([
      collection
        .find(query)
        .sort({ lastSeenAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ]);

    return { sessions, total };
  }
}

// Factory function
let repositories: Map<string, TrackingRepository> = new Map();

export function getTrackingRepository(brandId: string): TrackingRepository {
  if (!repositories.has(brandId)) {
    repositories.set(brandId, new TrackingRepository(brandId));
  }
  return repositories.get(brandId)!;
}
