import { NextRequest } from 'next/server';
import { deployToServer, StepUpdate } from '@/lib/deploy-scripts';
import { DeploymentConfig } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const config: DeploymentConfig = await request.json();

    // Validate required fields
    if (!config.server.host || !config.server.username) {
      return new Response(
        JSON.stringify({ error: 'Server configuration is incomplete' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!config.domain.domain || !config.domain.brandId) {
      return new Response(
        JSON.stringify({ error: 'Domain configuration is incomplete' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = (update: StepUpdate) => {
          const data = `data: ${JSON.stringify(update)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        try {
          await deployToServer(config, sendUpdate);
        } catch (error) {
          sendUpdate({
            stepId: 'connect',
            status: 'error',
            error: error instanceof Error ? error.message : 'Deployment failed',
            complete: true,
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Deploy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Deployment failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
