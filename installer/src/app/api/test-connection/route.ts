import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/ssh-client';
import { ServerConfig } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const config: ServerConfig = await request.json();

    // Validate required fields
    if (!config.host || !config.username) {
      return NextResponse.json(
        { success: false, error: 'Host and username are required' },
        { status: 400 }
      );
    }

    if (config.authMethod === 'password' && !config.password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    if (config.authMethod === 'key' && !config.privateKey) {
      return NextResponse.json(
        { success: false, error: 'Private key is required' },
        { status: 400 }
      );
    }

    const result = await testConnection(config);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Connection test failed' },
      { status: 500 }
    );
  }
}
