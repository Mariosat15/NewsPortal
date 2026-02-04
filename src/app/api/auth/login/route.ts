import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db/mongodb';
import { User, toSafeUser, createVisit } from '@/lib/db/models/user';
import { verifyPassword, validateEmail } from '@/lib/auth/password';
import { getBrandId } from '@/lib/brand/server';
import { getSessionRepository } from '@/lib/db/repositories/session-repository';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get brand-specific database
    const brandId = await getBrandId();
    const usersCollection = await getCollection<User>(brandId, 'users');

    // Find user by email
    const user = await usersCollection.findOne({ 
      email: email.toLowerCase(),
      authProvider: 'email',
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    // Get request metadata
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Create visit record
    const visit = createVisit(ip, userAgent, '', '/login', '');

    // Update last seen and add visit
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: { 
          lastSeen: new Date(),
          updatedAt: new Date(),
        },
        $push: { visits: visit },
        $inc: { totalVisits: 1 },
      }
    );

    // Create secure session
    const sessionRepo = getSessionRepository(brandId);
    const session = await sessionRepo.create({
      userId: user._id!.toString(),
      userEmail: user.email!,
      userName: user.name,
      userAvatar: user.avatar,
      userAgent: userAgent,
      ipAddress: ip,
      expiresInDays: 30,
    });

    // Set session token cookie (not the entire user object)
    const cookieStore = await cookies();
    cookieStore.set('session_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Also set legacy cookie for backward compatibility during transition
    const safeUser = toSafeUser(user);
    cookieStore.set('user_session', JSON.stringify(safeUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: safeUser,
      message: 'Login successful',
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
