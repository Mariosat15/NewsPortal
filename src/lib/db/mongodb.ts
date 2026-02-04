import { MongoClient, Db, Collection, ObjectId, Document } from 'mongodb';

// Extend globalThis to include our MongoDB cache
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientCache: Map<string, MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoDbCache: Map<string, Db> | undefined;
  // eslint-disable-next-line no-var
  var _mongoPromiseCache: Map<string, Promise<Db>> | undefined;
}

// Use global cache to persist connections across Next.js hot reloads and workers
const clientCache: Map<string, MongoClient> = global._mongoClientCache ?? new Map();
const dbCache: Map<string, Db> = global._mongoDbCache ?? new Map();
const promiseCache: Map<string, Promise<Db>> = global._mongoPromiseCache ?? new Map();

// Store in global for persistence
if (process.env.NODE_ENV !== 'production') {
  global._mongoClientCache = clientCache;
  global._mongoDbCache = dbCache;
  global._mongoPromiseCache = promiseCache;
}

// Get or create a MongoDB connection for a specific brand database
export async function getDatabase(brandId: string): Promise<Db> {
  const cacheKey = brandId;
  
  // Check if we already have a cached connection
  if (dbCache.has(cacheKey)) {
    return dbCache.get(cacheKey)!;
  }

  // Check if there's already a connection in progress (prevents race conditions)
  if (promiseCache.has(cacheKey)) {
    return promiseCache.get(cacheKey)!;
  }

  // Build the MongoDB URI for this brand
  const baseUri = process.env.MONGODB_URI;
  if (!baseUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // Replace the database name in the URI with the brand-specific database
  const dbName = `newsportal_${brandId}`;
  const uri = baseUri.replace(/\/[^/?]+(\?|$)/, `/${dbName}$1`);

  // Create the connection promise
  const connectionPromise = (async () => {
    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    
    // Cache the connection
    clientCache.set(cacheKey, client);
    dbCache.set(cacheKey, db);

    console.log(`Connected to MongoDB database: ${dbName}`);
    
    return db;
  })();

  // Cache the promise to prevent duplicate connections
  promiseCache.set(cacheKey, connectionPromise);

  try {
    return await connectionPromise;
  } catch (error) {
    // Remove the failed promise from cache
    promiseCache.delete(cacheKey);
    throw error;
  }
}

// Get a specific collection from a brand's database
export async function getCollection<T extends Document>(
  brandId: string,
  collectionName: string
): Promise<Collection<T>> {
  const db = await getDatabase(brandId);
  return db.collection<T>(collectionName);
}

// Close all database connections (useful for graceful shutdown)
export async function closeAllConnections(): Promise<void> {
  for (const [key, client] of clientCache) {
    await client.close();
    console.log(`Closed MongoDB connection for: ${key}`);
  }
  clientCache.clear();
  dbCache.clear();
}

// Helper to convert string to ObjectId
export function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}

// Helper to check if a string is a valid ObjectId
export function isValidObjectId(id: string): boolean {
  try {
    new ObjectId(id);
    return true;
  } catch {
    return false;
  }
}

// Export ObjectId for use in other files
export { ObjectId };

// Initialize database indexes for production performance
export async function initializeIndexes(brandId: string): Promise<{ created: string[]; errors: string[] }> {
  const db = await getDatabase(brandId);
  const created: string[] = [];
  const errors: string[] = [];

  // Articles collection indexes
  const articles = db.collection('articles');
  try {
    await articles.createIndex({ slug: 1 }, { unique: true, background: true });
    created.push('articles.slug (unique)');
  } catch (e) {
    errors.push(`articles.slug: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await articles.createIndex({ status: 1, publishDate: -1 }, { background: true });
    created.push('articles.status_publishDate');
  } catch (e) {
    errors.push(`articles.status_publishDate: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await articles.createIndex({ category: 1, status: 1 }, { background: true });
    created.push('articles.category_status');
  } catch (e) {
    errors.push(`articles.category_status: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await articles.createIndex({ language: 1, status: 1 }, { background: true });
    created.push('articles.language_status');
  } catch (e) {
    errors.push(`articles.language_status: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await articles.createIndex({ createdAt: -1 }, { background: true });
    created.push('articles.createdAt');
  } catch (e) {
    errors.push(`articles.createdAt: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await articles.createIndex(
      { title: 'text', teaser: 'text', content: 'text' },
      { background: true, weights: { title: 10, teaser: 5, content: 1 } }
    );
    created.push('articles.text_search');
  } catch (e) {
    errors.push(`articles.text_search: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  // Users collection indexes
  const users = db.collection('users');
  try {
    await users.createIndex({ email: 1 }, { unique: true, sparse: true, background: true });
    created.push('users.email (unique, sparse)');
  } catch (e) {
    errors.push(`users.email: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await users.createIndex({ normalizedMsisdn: 1 }, { unique: true, sparse: true, background: true });
    created.push('users.normalizedMsisdn (unique, sparse)');
  } catch (e) {
    errors.push(`users.normalizedMsisdn: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await users.createIndex({ lastSeen: -1 }, { background: true });
    created.push('users.lastSeen');
  } catch (e) {
    errors.push(`users.lastSeen: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await users.createIndex({ authProvider: 1, isActive: 1 }, { background: true });
    created.push('users.authProvider_isActive');
  } catch (e) {
    errors.push(`users.authProvider_isActive: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  // Unlocks collection indexes
  const unlocks = db.collection('unlocks');
  try {
    await unlocks.createIndex({ transactionId: 1 }, { unique: true, background: true });
    created.push('unlocks.transactionId (unique)');
  } catch (e) {
    errors.push(`unlocks.transactionId: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await unlocks.createIndex({ normalizedMsisdn: 1, articleId: 1, status: 1 }, { background: true });
    created.push('unlocks.msisdn_article_status');
  } catch (e) {
    errors.push(`unlocks.msisdn_article_status: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await unlocks.createIndex({ articleId: 1, status: 1 }, { background: true });
    created.push('unlocks.articleId_status');
  } catch (e) {
    errors.push(`unlocks.articleId_status: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await unlocks.createIndex({ unlockedAt: -1 }, { background: true });
    created.push('unlocks.unlockedAt');
  } catch (e) {
    errors.push(`unlocks.unlockedAt: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await unlocks.createIndex({ status: 1, unlockedAt: -1 }, { background: true });
    created.push('unlocks.status_unlockedAt');
  } catch (e) {
    errors.push(`unlocks.status_unlockedAt: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  // Billing imports collection indexes
  const billingImports = db.collection('billing_imports');
  try {
    await billingImports.createIndex({ transactionId: 1 }, { unique: true, background: true });
    created.push('billing_imports.transactionId (unique)');
  } catch (e) {
    errors.push(`billing_imports.transactionId: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await billingImports.createIndex({ importBatchId: 1 }, { background: true });
    created.push('billing_imports.importBatchId');
  } catch (e) {
    errors.push(`billing_imports.importBatchId: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await billingImports.createIndex({ processed: 1, importedAt: -1 }, { background: true });
    created.push('billing_imports.processed_importedAt');
  } catch (e) {
    errors.push(`billing_imports.processed_importedAt: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  // Sessions collection indexes
  const sessions = db.collection('sessions');
  try {
    await sessions.createIndex({ token: 1 }, { unique: true, background: true });
    created.push('sessions.token (unique)');
  } catch (e) {
    errors.push(`sessions.token: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await sessions.createIndex({ userId: 1 }, { background: true });
    created.push('sessions.userId');
  } catch (e) {
    errors.push(`sessions.userId: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  try {
    await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true });
    created.push('sessions.expiresAt (TTL)');
  } catch (e) {
    errors.push(`sessions.expiresAt: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  console.log(`Database indexes initialized for ${brandId}:`, { created, errors });
  return { created, errors };
}
