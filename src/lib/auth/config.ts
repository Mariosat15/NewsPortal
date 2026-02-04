import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';

// Get MongoDB client for auth
const getMongoClient = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  const client = new MongoClient(uri);
  await client.connect();
  return client;
};

// Create the auth instance
export const auth = betterAuth({
  database: mongodbAdapter(getMongoClient),
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session every day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes cache
    },
  },

  // Secret for signing tokens
  secret: process.env.BETTER_AUTH_SECRET,

  // Base URL
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

  // Email and password authentication (for admin)
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  // Advanced configuration
  advanced: {
    generateId: () => {
      // Use crypto for generating IDs
      return crypto.randomUUID();
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
