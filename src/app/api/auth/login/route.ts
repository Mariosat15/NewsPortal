import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/db/mongodb';
import { User, toSafeUser, createVisit } from '@/lib/db/models/user';
import { verifyPassword, validateEmail } from '@/lib/auth/password';
import { getBrandId } from '@/lib/brand/server';
import { getSessionRepository } from '@/lib/db/repositories/session-repository';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  // Email authentication has been disabled - system now uses MSISDN-based authentication
  // Articles are unlocked via Direct Carrier Billing (DCB)
  console.log('[Auth] Login attempt blocked - email authentication is deprecated');
  
  return NextResponse.json(
    { 
      error: 'Email authentication is no longer available',
      message: 'This platform now uses mobile carrier billing. Articles are accessible via your mobile phone number (MSISDN) when you make a purchase.',
      deprecated: true,
      redirectTo: '/',
    },
    { status: 410 } // 410 Gone - resource permanently removed
  );
}
