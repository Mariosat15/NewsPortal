import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

// Cache the MongoDB client connections per database
const clientCache: Map<string, MongoClient> = new Map();
const dbCache: Map<string, Db> = new Map();

// Get or create a MongoDB connection for a specific brand database
export async function getDatabase(brandId: string): Promise<Db> {
  const cacheKey = brandId;
  
  // Check if we already have a cached connection
  if (dbCache.has(cacheKey)) {
    return dbCache.get(cacheKey)!;
  }

  // Build the MongoDB URI for this brand
  const baseUri = process.env.MONGODB_URI;
  if (!baseUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // Replace the database name in the URI with the brand-specific database
  const dbName = `newsportal_${brandId}`;
  const uri = baseUri.replace(/\/[^/?]+(\?|$)/, `/${dbName}$1`);

  // Create a new client
  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db(dbName);
  
  // Cache the connection
  clientCache.set(cacheKey, client);
  dbCache.set(cacheKey, db);

  console.log(`Connected to MongoDB database: ${dbName}`);
  
  return db;
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
