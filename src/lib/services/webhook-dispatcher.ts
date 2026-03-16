/**
 * Webhook dispatcher — sends HTTP POST to configured webhook endpoints.
 * Reason: Lets external systems react to real-time events (purchases, subscribers)
 * without polling. Uses HMAC-SHA256 signature for payload verification.
 */

import crypto from 'crypto';
import { getCollection } from '@/lib/db/mongodb';
import { Webhook, WebhookEventType, WebhookLog } from '@/lib/db/models/webhook';

/**
 * Dispatch an event to all active webhooks that listen for this event type.
 * Fire-and-forget: errors are logged, not thrown.
 */
export async function dispatchWebhookEvent(
  brandId: string,
  event: WebhookEventType,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const webhooksCol = await getCollection<Webhook>(brandId, 'webhooks');
    const logsCol = await getCollection<WebhookLog>(brandId, 'webhook_logs');

    const webhooks = await webhooksCol.find({
      tenantId: brandId,
      active: true,
      events: event,
      failCount: { $lt: 10 }, // Auto-disable after 10 consecutive failures
    }).toArray();

    if (webhooks.length === 0) return;

    const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });

    await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const start = Date.now();
        let statusCode: number | undefined;
        let responseBody: string | undefined;
        let success = false;
        let error: string | undefined;

        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Webhook-Event': event,
          };

          // HMAC signature
          if (webhook.secret) {
            const sig = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex');
            headers['X-Webhook-Signature'] = `sha256=${sig}`;
          }

          const res = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body,
            signal: AbortSignal.timeout(10_000), // 10s timeout
          });

          statusCode = res.status;
          responseBody = (await res.text()).slice(0, 500); // Truncate response
          success = res.ok;

          // Reset or increment fail count
          if (success) {
            await webhooksCol.updateOne(
              { _id: webhook._id },
              { $set: { failCount: 0, lastTriggeredAt: new Date() } }
            );
          } else {
            error = `HTTP ${statusCode}`;
            await webhooksCol.updateOne(
              { _id: webhook._id },
              { $inc: { failCount: 1 }, $set: { lastTriggeredAt: new Date() } }
            );
          }
        } catch (err: unknown) {
          error = err instanceof Error ? err.message : 'Unknown error';
          await webhooksCol.updateOne(
            { _id: webhook._id },
            { $inc: { failCount: 1 }, $set: { lastTriggeredAt: new Date() } }
          );
        }

        const durationMs = Date.now() - start;

        // Log the attempt
        await logsCol.insertOne({
          tenantId: brandId,
          webhookId: webhook._id!,
          event,
          payload,
          statusCode,
          responseBody,
          success,
          error,
          timestamp: new Date(),
          durationMs,
        });
      })
    );
  } catch (err) {
    console.error('[Webhook Dispatcher] Fatal error:', err);
  }
}
