// Note: This is a simplified auth configuration.
// For MSISDN-based authentication, we use cookie-based session management.
// better-auth is available for admin panel authentication if needed.

import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// Get MongoDB client for auth
export async function getAuthDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db();
  return cachedDb;
}

// Admin authentication (simple email/password)
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminEmail || !adminPassword) {
    console.warn('Admin credentials not configured');
    return false;
  }

  return email === adminEmail && password === adminPassword;
}

// Session types
export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
}
