import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { getCollection } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/user';
import { getBrandId } from '@/lib/brand/server';
import { hashPassword, verifyPassword, validatePassword } from '@/lib/auth/password';
import { ObjectId } from 'mongodb';

// Get base URL from request headers (works with proxies/tunnels)
async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

// GET - Get user profile (redirects to /api/auth/me for now)
export async function GET() {
  const baseUrl = await getBaseUrl();
  return NextResponse.redirect(new URL('/api/auth/me', baseUrl));
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user_session')?.value;
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sessionData = JSON.parse(userCookie);
    const brandId = await getBrandId();
    const usersCollection = await getCollection<User>(brandId, 'users');

    // Get current user
    const user = await usersCollection.findOne({ _id: new ObjectId(sessionData.id) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, currentPassword, newPassword } = body;

    const updates: Record<string, unknown> = {};

    // Update name if provided
    if (name !== undefined) {
      updates.name = name.trim();
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      }

      // Verify current password
      if (!user.passwordHash) {
        return NextResponse.json({ error: 'Account does not have a password set' }, { status: 400 });
      }

      const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      // Validate new password
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        return NextResponse.json({ 
          error: passwordError
        }, { status: 400 });
      }

      // Hash new password
      updates.passwordHash = await hashPassword(newPassword);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    // Update user
    updates.updatedAt = new Date();
    const result = await usersCollection.updateOne(
      { _id: user._id },
      { $set: updates }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Get updated user
    const updatedUser = await usersCollection.findOne({ _id: user._id });

    // Update session cookie with new data
    const safeUser = {
      id: updatedUser?._id?.toString(),
      email: updatedUser?.email,
      name: updatedUser?.name,
      avatar: updatedUser?.avatar,
      emailVerified: updatedUser?.emailVerified,
      createdAt: updatedUser?.createdAt,
    };

    const response = NextResponse.json({
      success: true,
      message: newPassword ? 'Profile and password updated' : 'Profile updated',
      user: safeUser,
    });

    // Update session cookie
    response.cookies.set('user_session', JSON.stringify(safeUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
