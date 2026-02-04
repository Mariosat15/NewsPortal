import { ObjectId } from 'mongodb';
import { randomBytes } from 'crypto';

export interface Session {
  _id?: ObjectId;
  token: string;
  userId: ObjectId;
  userEmail: string;
  userName?: string;
  userAvatar?: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface SessionCreateInput {
  userId: string | ObjectId;
  userEmail: string;
  userName?: string;
  userAvatar?: string;
  userAgent?: string;
  ipAddress?: string;
  expiresInDays?: number;
}

// Generate a secure random token
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

// Create a new session object
export function createSession(input: SessionCreateInput): Omit<Session, '_id'> {
  const now = new Date();
  const expiresInDays = input.expiresInDays || 30;
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

  return {
    token: generateSessionToken(),
    userId: typeof input.userId === 'string' ? new ObjectId(input.userId) : input.userId,
    userEmail: input.userEmail,
    userName: input.userName,
    userAvatar: input.userAvatar,
    createdAt: now,
    expiresAt,
    lastActivityAt: now,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  };
}

// Convert session to safe object for cookie
export function sessionToCookie(session: Session): string {
  return session.token;
}
