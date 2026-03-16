import { NextRequest, NextResponse } from 'next/server';
import { getBrandId } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';
import { ScheduledReport, ReportFrequency, ReportType } from '@/lib/db/models/scheduled-report';
import { ObjectId } from 'mongodb';

const VALID_FREQUENCIES: ReportFrequency[] = ['daily', 'weekly', 'monthly'];
const VALID_TYPES: ReportType[] = ['revenue', 'traffic', 'campaigns', 'full'];

function computeNextRun(frequency: ReportFrequency): Date {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

/** GET — list all scheduled reports */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const col = await getCollection<ScheduledReport>(brandId, 'scheduled_reports');
    const reports = await col.find({ tenantId: brandId }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error('Scheduled reports list error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

/** POST — create a scheduled report */
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const body = await request.json();
    const { name, type, frequency, recipientEmails } = body;

    if (!name || !type || !frequency || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'name, type, frequency, and recipientEmails[] are required' },
        { status: 400 }
      );
    }

    if (!VALID_FREQUENCIES.includes(frequency)) {
      return NextResponse.json(
        { success: false, error: `frequency must be: ${VALID_FREQUENCIES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: `type must be: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const col = await getCollection<ScheduledReport>(brandId, 'scheduled_reports');
    const now = new Date();

    const report: ScheduledReport = {
      tenantId: brandId,
      name: name.trim(),
      type,
      frequency,
      recipientEmails,
      active: true,
      nextRunAt: computeNextRun(frequency),
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(report);

    return NextResponse.json({
      success: true,
      report: { ...report, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Scheduled report create error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

/** PUT — update a scheduled report */
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

    const col = await getCollection<ScheduledReport>(brandId, 'scheduled_reports');
    const setFields: Record<string, unknown> = { updatedAt: new Date() };

    if (updates.name) setFields.name = updates.name.trim();
    if (updates.type && VALID_TYPES.includes(updates.type)) setFields.type = updates.type;
    if (updates.frequency && VALID_FREQUENCIES.includes(updates.frequency)) {
      setFields.frequency = updates.frequency;
      setFields.nextRunAt = computeNextRun(updates.frequency);
    }
    if (updates.recipientEmails) setFields.recipientEmails = updates.recipientEmails;
    if (updates.active !== undefined) setFields.active = updates.active;

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id), tenantId: brandId },
      { $set: setFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, report: result });
  } catch (error) {
    console.error('Scheduled report update error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

/** DELETE — delete a scheduled report */
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

    const col = await getCollection<ScheduledReport>(brandId, 'scheduled_reports');
    await col.deleteOne({ _id: new ObjectId(id), tenantId: brandId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Scheduled report delete error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
