import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db/mongodb';
import { createEmailUser, User, toSafeUser } from '@/lib/db/models/user';
import { hashPassword, validatePassword, validateEmail } from '@/lib/auth/password';
import { getBrandId } from '@/lib/brand/server';
import { getSessionRepository } from '@/lib/db/repositories/session-repository';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
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

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
        { status: 400 }
      );
    }

    // Validate name
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Get brand-specific database
    const brandId = await getBrandId();
    const usersCollection = await getCollection<User>(brandId, 'users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ 
      email: email.toLowerCase() 
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Get request metadata
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Create user
    const userData = createEmailUser({
      email: email.toLowerCase(),
      passwordHash,
      name: name.trim(),
      ip,
      userAgent,
    });

    // Insert into database
    const result = await usersCollection.insertOne(userData as User);

    // Create user object with ID for session
    const newUser: User = {
      ...userData,
      _id: result.insertedId,
    };

    // Create secure session
    const sessionRepo = getSessionRepository(brandId);
    const session = await sessionRepo.create({
      userId: result.insertedId.toString(),
      userEmail: newUser.email!,
      userName: newUser.name,
      userAvatar: newUser.avatar,
      userAgent,
      ipAddress: ip,
      expiresInDays: 30,
    });

    // Set session token cookie
    const cookieStore = await cookies();
    cookieStore.set('session_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Also set legacy cookie for backward compatibility
    const safeUser = toSafeUser(newUser);
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
      message: 'Account created successfully',
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
