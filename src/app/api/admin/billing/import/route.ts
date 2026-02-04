import { NextRequest, NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand';
import { getCollection, createBillingImport, parseCSVRow, BillingImport } from '@/lib/db';

// POST /api/admin/billing/import - Import billing CSV
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: 'CSV file is empty or has no data rows' },
        { status: 400 }
      );
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Create column mapping
    const columnMapping = {
      msisdn: header.find(h => h.includes('msisdn') || h.includes('phone')) || 'msisdn',
      transactionId: header.find(h => h.includes('transaction') || h.includes('id')) || 'transaction_id',
      amount: header.find(h => h.includes('amount') || h.includes('price')) || 'amount',
      status: header.find(h => h.includes('status')) || 'status',
      date: header.find(h => h.includes('date') || h.includes('time')) || 'date',
    };

    // Generate batch ID
    const importBatchId = `import-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Parse rows
    const brandId = getBrandIdSync();
    const collection = await getCollection<BillingImport>(brandId, 'billing_imports');

    const results = {
      total: lines.length - 1,
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        results.skipped++;
        continue;
      }

      try {
        // Parse CSV row (handle quoted values)
        const values = line.match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g)
          ?.map(v => v.replace(/^,/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || [];

        // Create row object
        const row: Record<string, string> = {};
        header.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        // Parse to billing import
        const importData = parseCSVRow(row, importBatchId, columnMapping);

        if (!importData) {
          results.errors.push(`Row ${i + 1}: Missing required fields`);
          results.skipped++;
          continue;
        }

        // Check for duplicate transaction
        const existing = await collection.findOne({ 
          transactionId: importData.transactionId 
        });
        
        if (existing) {
          results.skipped++;
          continue;
        }

        // Insert billing import
        const billingImport = createBillingImport(importData);
        await collection.insertOne(billingImport as BillingImport);
        results.imported++;
      } catch (error) {
        results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Billing import error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import billing data' },
      { status: 500 }
    );
  }
}
