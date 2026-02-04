import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCollection } from '@/lib/db/mongodb';
import { User, toSafeUser, SafeUser } from '@/lib/db/models/user';
import { getBrandId } from '@/lib/brand/server';
import { getSessionRepository } from '@/lib/db/repositories/session-repository';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    const legacyCookie = cookieStore.get('user_session')?.value;
    
    const brandId = await getBrandId();

    // Try new session token first
    if (sessionToken) {
      const sessionRepo = getSessionRepository(brandId);
      const session = await sessionRepo.findByToken(sessionToken);

      if (session) {
        // Valid session found, get fresh user data
        const usersCollection = await getCollection<User>(brandId, 'users');
        const user = await usersCollection.findOne({ _id: session.userId });

        if (!user) {
          // User deleted, clean up session
          await sessionRepo.delete(sessionToken);
          cookieStore.delete('session_token');
          cookieStore.delete('user_session');
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.isActive) {
          // User deactivated, clean up session
          await sessionRepo.delete(sessionToken);
          cookieStore.delete('session_token');
          cookieStore.delete('user_session');
          return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
        }

        // Update session activity
        await sessionRepo.updateActivity(sessionToken);

        return NextResponse.json({
          success: true,
          user: toSafeUser(user),
        });
      }
    }

    // Fallback to legacy cookie for backward compatibility
    if (legacyCookie) {
      let sessionUser: SafeUser;
      try {
        sessionUser = JSON.parse(legacyCookie);
      } catch {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }

      if (!sessionUser.id) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }

      const usersCollection = await getCollection<User>(brandId, 'users');
      const user = await usersCollection.findOne({ _id: new ObjectId(sessionUser.id) });

      if (!user) {
        cookieStore.delete('user_session');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (!user.isActive) {
        cookieStore.delete('user_session');
        return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        user: toSafeUser(user),
      });
    }

    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}
