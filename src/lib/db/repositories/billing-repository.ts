import { Collection, ObjectId } from 'mongodb';
import { getCollection } from '../mongodb';
import {
  BillingEvent,
  BillingEventCreateInput,
  BillingEventSearchParams,
  BillingSource,
  BillingStatus,
} from '../models/billing-event';
import {
  ImportBatch,
  ImportBatchCreateInput,
  ImportBatchUpdateInput,
  ImportBatchSearchParams,
  ImportError,
} from '../models/import-batch';
import { normalizePhoneNumber } from '@/lib/utils/phone';
import crypto from 'crypto';

export class BillingRepository {
  private brandId: string;
  private billingPromise: Promise<Collection<BillingEvent>>;
  private batchesPromise: Promise<Collection<ImportBatch>>;

  constructor(brandId: string) {
    this.brandId = brandId;
    this.billingPromise = this.initBillingCollection();
    this.batchesPromise = this.initBatchesCollection();
  }

  private async initBillingCollection(): Promise<Collection<BillingEvent>> {
    const collection = await getCollection<BillingEvent>(this.brandId, 'billing_events');
    
    await collection.createIndex({ billingEventId: 1 }, { unique: true });
    await collection.createIndex({ normalizedMsisdn: 1, eventTime: -1 });
    await collection.createIndex({ tenantId: 1, source: 1, eventTime: -1 });
    await collection.createIndex({ importBatchId: 1 }, { sparse: true });
    await collection.createIndex({ eventTime: -1 });
    await collection.createIndex({ status: 1 });
    await collection.createIndex({ transactionId: 1 }, { sparse: true, unique: true });
    
    return collection;
  }

  private async initBatchesCollection(): Promise<Collection<ImportBatch>> {
    const collection = await getCollection<ImportBatch>(this.brandId, 'import_batches');
    
    await collection.createIndex({ tenantId: 1, uploadedAt: -1 });
    await collection.createIndex({ status: 1 });
    await collection.createIndex({ uploadedAt: -1 });
    
    return collection;
  }

  // Generate deterministic billing event ID for deduplication
  private generateBillingEventId(msisdn: string, eventTime: Date, amount: number, source: BillingSource, productCode?: string): string {
    const data = `${msisdn}|${eventTime.toISOString()}|${amount}|${source}|${productCode || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  // Billing Event methods
  async createBillingEvent(input: BillingEventCreateInput): Promise<BillingEvent> {
    const collection = await this.billingPromise;
    const now = new Date();
    const normalizedMsisdn = input.normalizedMsisdn || normalizePhoneNumber(input.msisdn);
    const eventTime = input.eventTime || now;

    const billingEventId = input.billingEventId || this.generateBillingEventId(
      normalizedMsisdn,
      eventTime,
      input.amount,
      input.source,
      input.productCode
    );

    const billingEvent: BillingEvent = {
      billingEventId,
      msisdn: input.msisdn,
      normalizedMsisdn,
      tenantId: input.tenantId,
      source: input.source,
      amount: input.amount,
      currency: input.currency || 'EUR',
      productCode: input.productCode,
      serviceName: input.serviceName,
      description: input.description,
      eventTime,
      status: input.status || 'billed',
      rawRowJson: input.rawRowJson,
      importBatchId: input.importBatchId,
      sessionId: input.sessionId,
      articleId: input.articleId,
      articleSlug: input.articleSlug,
      transactionId: input.transactionId,
      createdAt: now,
    };

    try {
      const result = await collection.insertOne(billingEvent);
      return { ...billingEvent, _id: result.insertedId };
    } catch (error: unknown) {
      // Check for duplicate key error
      if ((error as { code?: number }).code === 11000) {
        const existing = await collection.findOne({ billingEventId });
        if (existing) return existing;
      }
      throw error;
    }
  }

  async findByBillingEventId(billingEventId: string): Promise<BillingEvent | null> {
    const collection = await this.billingPromise;
    return collection.findOne({ billingEventId });
  }

  async findByTransactionId(transactionId: string): Promise<BillingEvent | null> {
    const collection = await this.billingPromise;
    return collection.findOne({ transactionId });
  }

  async getByMsisdn(normalizedMsisdn: string, params: {
    dateFrom?: Date;
    dateTo?: Date;
    source?: BillingSource;
    status?: BillingStatus;
    limit?: number;
  } = {}): Promise<BillingEvent[]> {
    const collection = await this.billingPromise;
    const { dateFrom, dateTo, source, status, limit = 100 } = params;

    const query: Record<string, unknown> = { normalizedMsisdn };
    
    if (source) query.source = source;
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.eventTime = {};
      if (dateFrom) (query.eventTime as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (query.eventTime as Record<string, Date>).$lte = dateTo;
    }

    return collection
      .find(query)
      .sort({ eventTime: -1 })
      .limit(limit)
      .toArray();
  }

  async search(params: BillingEventSearchParams): Promise<{ events: BillingEvent[]; total: number }> {
    const collection = await this.billingPromise;
    const { 
      msisdn, normalizedMsisdn, tenantId, source, status,
      dateFrom, dateTo, importBatchId,
      page = 1, limit = 50 
    } = params;

    const query: Record<string, unknown> = {};
    
    if (normalizedMsisdn) query.normalizedMsisdn = normalizedMsisdn;
    if (msisdn) query.msisdn = { $regex: msisdn, $options: 'i' };
    if (tenantId) query.tenantId = tenantId;
    if (source) query.source = source;
    if (status) query.status = status;
    if (importBatchId) query.importBatchId = importBatchId;
    if (dateFrom || dateTo) {
      query.eventTime = {};
      if (dateFrom) (query.eventTime as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (query.eventTime as Record<string, Date>).$lte = dateTo;
    }

    const [events, total] = await Promise.all([
      collection
        .find(query)
        .sort({ eventTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ]);

    return { events, total };
  }

  async updateStatus(billingEventId: string, status: BillingStatus): Promise<BillingEvent | null> {
    const collection = await this.billingPromise;
    return collection.findOneAndUpdate(
      { billingEventId },
      { $set: { status } },
      { returnDocument: 'after' }
    );
  }

  async getStats(tenantId?: string, dateFrom?: Date, dateTo?: Date): Promise<{
    totalEvents: number;
    totalAmount: number;
    bySource: Record<string, { count: number; amount: number }>;
    byStatus: Record<string, number>;
  }> {
    const collection = await this.billingPromise;
    
    const matchStage: Record<string, unknown> = {};
    if (tenantId) matchStage.tenantId = tenantId;
    if (dateFrom || dateTo) {
      matchStage.eventTime = {};
      if (dateFrom) (matchStage.eventTime as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (matchStage.eventTime as Record<string, Date>).$lte = dateTo;
    }

    const [totals, bySource, byStatus] = await Promise.all([
      collection.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]).toArray(),
      collection.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
          },
        },
      ]).toArray(),
      collection.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]).toArray(),
    ]);

    const sourceMap: Record<string, { count: number; amount: number }> = {};
    for (const s of bySource) {
      sourceMap[s._id] = { count: s.count, amount: s.amount };
    }

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) {
      statusMap[s._id] = s.count;
    }

    return {
      totalEvents: totals[0]?.totalEvents || 0,
      totalAmount: totals[0]?.totalAmount || 0,
      bySource: sourceMap,
      byStatus: statusMap,
    };
  }

  // Import Batch methods
  async createImportBatch(input: ImportBatchCreateInput): Promise<ImportBatch> {
    const collection = await this.batchesPromise;
    const now = new Date();

    const batch: ImportBatch = {
      tenantId: input.tenantId,
      fileName: input.fileName,
      originalFileName: input.originalFileName,
      fileSize: input.fileSize,
      uploadedBy: input.uploadedBy,
      uploadedAt: now,
      source: input.source,
      totalRows: 0,
      accepted: 0,
      rejected: 0,
      duplicates: 0,
      errors: [],
      status: 'processing',
      columnMapping: input.columnMapping,
      notes: input.notes,
    };

    const result = await collection.insertOne(batch);
    return { ...batch, _id: result.insertedId };
  }

  async updateImportBatch(id: string | ObjectId, input: ImportBatchUpdateInput): Promise<ImportBatch | null> {
    const collection = await this.batchesPromise;
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;

    const updateFields: Record<string, unknown> = {};
    
    if (input.totalRows !== undefined) updateFields.totalRows = input.totalRows;
    if (input.accepted !== undefined) updateFields.accepted = input.accepted;
    if (input.rejected !== undefined) updateFields.rejected = input.rejected;
    if (input.duplicates !== undefined) updateFields.duplicates = input.duplicates;
    if (input.errors) updateFields.errors = input.errors;
    if (input.status) updateFields.status = input.status;
    if (input.processingStartedAt) updateFields.processingStartedAt = input.processingStartedAt;
    if (input.processingCompletedAt) updateFields.processingCompletedAt = input.processingCompletedAt;

    return collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
  }

  async addImportError(batchId: ObjectId, error: ImportError): Promise<void> {
    const collection = await this.batchesPromise;
    await collection.updateOne(
      { _id: batchId },
      { 
        $push: { errors: error },
        $inc: { rejected: 1 },
      }
    );
  }

  async incrementImportStats(batchId: ObjectId, field: 'accepted' | 'rejected' | 'duplicates', count: number = 1): Promise<void> {
    const collection = await this.batchesPromise;
    await collection.updateOne(
      { _id: batchId },
      { $inc: { [field]: count } }
    );
  }

  async getImportBatch(id: string | ObjectId): Promise<ImportBatch | null> {
    const collection = await this.batchesPromise;
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return collection.findOne({ _id: objectId });
  }

  async listImportBatches(params: ImportBatchSearchParams = {}): Promise<{ batches: ImportBatch[]; total: number }> {
    const collection = await this.batchesPromise;
    const { tenantId, source, status, dateFrom, dateTo, page = 1, limit = 20 } = params;

    const query: Record<string, unknown> = {};
    if (tenantId) query.tenantId = tenantId;
    if (source) query.source = source;
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.uploadedAt = {};
      if (dateFrom) (query.uploadedAt as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (query.uploadedAt as Record<string, Date>).$lte = dateTo;
    }

    const [batches, total] = await Promise.all([
      collection
        .find(query)
        .sort({ uploadedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
    ]);

    return { batches, total };
  }
}

// Factory function
let repositories: Map<string, BillingRepository> = new Map();

export function getBillingRepository(brandId: string): BillingRepository {
  if (!repositories.has(brandId)) {
    repositories.set(brandId, new BillingRepository(brandId));
  }
  return repositories.get(brandId)!;
}
