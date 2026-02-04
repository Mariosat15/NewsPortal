import { Collection, ObjectId } from 'mongodb';
import { getCollection } from '../mongodb';
import { Session, SessionCreateInput, createSession } from '../models/session';

const COLLECTION_NAME = 'sessions';

export class SessionRepository {
  private brandId: string;

  constructor(brandId: string) {
    this.brandId = brandId;
  }

  private async getCollection(): Promise<Collection<Session>> {
    return getCollection<Session>(this.brandId, COLLECTION_NAME);
  }

  // Create a new session
  async create(input: SessionCreateInput): Promise<Session> {
    const collection = await this.getCollection();
    const session = createSession(input);
    const result = await collection.insertOne(session as Session);
    return { ...session, _id: result.insertedId };
  }

  // Find session by token
  async findByToken(token: string): Promise<Session | null> {
    const collection = await this.getCollection();
    const session = await collection.findOne({ 
      token,
      expiresAt: { $gt: new Date() } // Only return non-expired sessions
    });
    return session;
  }

  // Update session activity timestamp
  async updateActivity(token: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { token },
      { $set: { lastActivityAt: new Date() } }
    );
  }

  // Delete session (logout)
  async delete(token: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ token });
    return result.deletedCount > 0;
  }

  // Delete all sessions for a user
  async deleteAllForUser(userId: string | ObjectId): Promise<number> {
    const collection = await this.getCollection();
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const result = await collection.deleteMany({ userId: userObjectId });
    return result.deletedCount;
  }

  // Get all active sessions for a user
  async getUserSessions(userId: string | ObjectId): Promise<Session[]> {
    const collection = await this.getCollection();
    const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    return collection.find({ 
      userId: userObjectId,
      expiresAt: { $gt: new Date() }
    }).sort({ lastActivityAt: -1 }).toArray();
  }

  // Clean up expired sessions
  async cleanupExpired(): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    return result.deletedCount;
  }

  // Extend session expiration
  async extendSession(token: string, days: number = 30): Promise<boolean> {
    const collection = await this.getCollection();
    const newExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const result = await collection.updateOne(
      { token },
      { 
        $set: { 
          expiresAt: newExpiresAt,
          lastActivityAt: new Date()
        } 
      }
    );
    return result.modifiedCount > 0;
  }
}

// Factory function
export function getSessionRepository(brandId: string): SessionRepository {
  return new SessionRepository(brandId);
}
