import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiToken } = await request.json();

    if (!apiToken) {
      return NextResponse.json({ valid: false, error: 'No API token provided' });
    }

    const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    return NextResponse.json({ valid: data.success === true });
  } catch (error) {
    return NextResponse.json({
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    });
  }
}
