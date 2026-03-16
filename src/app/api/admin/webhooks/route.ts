import { NextRequest, NextResponse } from 'next/server';
import { getBrandId } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';
import { Webhook, WebhookEventType } from '@/lib/db/models/webhook';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

const VALID_EVENTS: WebhookEventType[] = [
  'purchase.completed',
  'subscriber.new',
  'article.published',
  'visitor.msisdn_detected',
];

/**
 * GET /api/admin/webhooks — list all webhooks
 */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const col = await getCollection<Webhook>(brandId, 'webhooks');
    const webhooks = await col.find({ tenantId: brandId }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, webhooks });
  } catch (error) {
    console.error('Webhooks list error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

/**
 * POST /api/admin/webhooks — create a new webhook
 * Body: { name, url, events, secret? }
 */
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const body = await request.json();
    const { name, url, events, secret } = body;

    if (!name || !url || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'name, url, and events[] are required' },
        { status: 400 }
      );
    }

    // Validate events
    const invalidEvents = events.filter((e: string) => !VALID_EVENTS.includes(e as WebhookEventType));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid events: ${invalidEvents.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate URL
    try { new URL(url); } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL' },
        { status: 400 }
      );
    }

    const col = await getCollection<Webhook>(brandId, 'webhooks');
    const now = new Date();

    const webhook: Webhook = {
      tenantId: brandId,
      name: name.trim(),
      url: url.trim(),
      secret: secret || crypto.randomBytes(32).toString('hex'),
      events,
      active: true,
      createdAt: now,
      updatedAt: now,
      failCount: 0,
    };

    const result = await col.insertOne(webhook);

    return NextResponse.json({
      success: true,
      webhook: { ...webhook, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Webhook create error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/webhooks — update a webhook
 * Body: { id, name?, url?, events?, active?, secret? }
 */
export async function PUT(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const col = await getCollection<Webhook>(brandId, 'webhooks');
    const setFields: Record<string, unknown> = { updatedAt: new Date() };

    if (updates.name !== undefined) setFields.name = updates.name.trim();
    if (updates.url !== undefined) {
      try { new URL(updates.url); } catch {
        return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 });
      }
      setFields.url = updates.url.trim();
    }
    if (updates.events !== undefined) setFields.events = updates.events;
    if (updates.active !== undefined) setFields.active = updates.active;
    if (updates.secret !== undefined) setFields.secret = updates.secret;

    // Reset fail count when re-enabling
    if (updates.active === true) setFields.failCount = 0;

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id), tenantId: brandId },
      { $set: setFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ success: false, error: 'Webhook not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, webhook: result });
  } catch (error) {
    console.error('Webhook update error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/webhooks — delete a webhook
 * Body: { id }
 */
export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    const col = await getCollection<Webhook>(brandId, 'webhooks');
    const result = await col.deleteOne({ _id: new ObjectId(id), tenantId: brandId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Webhook not found' }, { status: 404 });
    }

    // Also clean up logs
    const logsCol = await getCollection(brandId, 'webhook_logs');
    await logsCol.deleteMany({ webhookId: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook delete error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
