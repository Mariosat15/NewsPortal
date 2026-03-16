import { NextRequest, NextResponse } from 'next/server';
import { getBrandId } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';
import { ABTest, ABTestVariant } from '@/lib/db/models/ab-test';
import { ObjectId } from 'mongodb';

/**
 * GET /api/admin/ab-tests — list all A/B tests
 */
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const col = await getCollection<ABTest>(brandId, 'ab_tests');
    const tests = await col.find({ tenantId: brandId }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, tests });
  } catch (error) {
    console.error('AB tests list error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

/**
 * POST /api/admin/ab-tests — create a new A/B test
 * Body: { name, description?, landingPageSlug?, variants: [{ id, name, weight, config }] }
 */
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const brandId = await getBrandId();
    const body = await request.json();
    const { name, description, landingPageSlug, variants } = body;

    if (!name || !Array.isArray(variants) || variants.length < 2) {
      return NextResponse.json(
        { success: false, error: 'name and at least 2 variants required' },
        { status: 400 }
      );
    }

    // Validate weights sum to 100
    const weightSum = variants.reduce((sum: number, v: ABTestVariant) => sum + (v.weight || 0), 0);
    if (weightSum !== 100) {
      return NextResponse.json(
        { success: false, error: `Variant weights must sum to 100 (currently ${weightSum})` },
        { status: 400 }
      );
    }

    const col = await getCollection<ABTest>(brandId, 'ab_tests');
    const now = new Date();

    const test: ABTest = {
      tenantId: brandId,
      name: name.trim(),
      description: description?.trim(),
      landingPageSlug,
      status: 'draft',
      variants: variants.map((v: ABTestVariant) => ({
        id: v.id,
        name: v.name,
        weight: v.weight,
        config: v.config || {},
        visitors: 0,
        conversions: 0,
      })),
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(test);

    return NextResponse.json({
      success: true,
      test: { ...test, _id: result.insertedId },
    });
  } catch (error) {
    console.error('AB test create error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/ab-tests — update an A/B test (status, variants, etc.)
 * Body: { id, status?, name?, variants? }
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

    const col = await getCollection<ABTest>(brandId, 'ab_tests');
    const setFields: Record<string, unknown> = { updatedAt: new Date() };

    if (updates.status) {
      setFields.status = updates.status;
      if (updates.status === 'running') setFields.startDate = new Date();
      if (updates.status === 'completed') setFields.endDate = new Date();
    }
    if (updates.name) setFields.name = updates.name.trim();
    if (updates.description !== undefined) setFields.description = updates.description;
    if (updates.variants) setFields.variants = updates.variants;

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id), tenantId: brandId },
      { $set: setFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, test: result });
  } catch (error) {
    console.error('AB test update error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/ab-tests — delete an A/B test
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

    const col = await getCollection<ABTest>(brandId, 'ab_tests');
    const result = await col.deleteOne({ _id: new ObjectId(id), tenantId: brandId });

    return NextResponse.json({
      success: result.deletedCount > 0,
    });
  } catch (error) {
    console.error('AB test delete error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
