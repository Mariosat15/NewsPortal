import { NextRequest, NextResponse } from 'next/server';
import { getBrandId } from '@/lib/brand/server';
import { getBillingRepository, getCustomerRepository, getUnlockRepository, getUserRepository } from '@/lib/db';
import { getCollection } from '@/lib/db/mongodb';
import { verifyAdmin } from '@/lib/auth/admin';
import { normalizePhoneNumber, isValidPhoneNumber } from '@/lib/utils/phone';
import { ImportSource } from '@/lib/db/models/import-batch';
import { BillingStatus } from '@/lib/db/models/billing-event';

// POST /api/admin/billing/import - Import billing CSV/Excel
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sourceType = (formData.get('source') as string) || 'DIMOCO';

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
    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    
    // Create column mapping (flexible matching)
    const findColumn = (patterns: string[]): number => {
      for (const pattern of patterns) {
        const idx = header.findIndex(h => h.includes(pattern));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const columnIndices = {
      msisdn: findColumn(['msisdn', 'phone', 'mobile', 'nummer', 'number']),
      transactionId: findColumn(['transaction', 'trans_id', 'id', 'reference']),
      amount: findColumn(['amount', 'price', 'betrag', 'value']),
      currency: findColumn(['currency', 'waehrung', 'curr']),
      status: findColumn(['status', 'state']),
      date: findColumn(['date', 'time', 'datum', 'timestamp', 'created']),
      productCode: findColumn(['product', 'service', 'produkt']),
      description: findColumn(['description', 'desc', 'beschreibung', 'name']),
      // Article fields for creating unlocks
      articleId: findColumn(['article_id', 'articleid', 'article']),
      articleSlug: findColumn(['article_slug', 'articleslug', 'slug']),
    };

    if (columnIndices.msisdn === -1) {
      return NextResponse.json(
        { success: false, error: 'Cannot find MSISDN/phone column in CSV' },
        { status: 400 }
      );
    }

    const brandId = await getBrandId();
    const billingRepo = getBillingRepository(brandId);
    const customerRepo = getCustomerRepository(brandId);
    const unlockRepo = getUnlockRepository(brandId);
    const userRepo = getUserRepository(brandId);
    const transactionsCollection = await getCollection(brandId, 'transactions');

    // Create import batch
    const batch = await billingRepo.createImportBatch({
      tenantId: brandId,
      fileName: `import_${Date.now()}.csv`,
      originalFileName: file.name,
      fileSize: file.size,
      uploadedBy: 'admin',
      source: sourceType as ImportSource,
      columnMapping: {
        msisdn: header[columnIndices.msisdn] || 'msisdn',
        amount: header[columnIndices.amount] || 'amount',
        date: header[columnIndices.date] || 'date',
      },
    });

    const batchId = batch._id!;

    // Update batch with total rows
    await billingRepo.updateImportBatch(batchId, {
      totalRows: lines.length - 1,
      processingStartedAt: new Date(),
    });

    const results = {
      total: lines.length - 1,
      accepted: 0,
      rejected: 0,
      duplicates: 0,
      errors: [] as { row: number; error: string }[],
    };

    // Parse rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        continue;
      }

      try {
        // Parse CSV row (handle quoted values)
        const values = parseCSVLine(line);

        // Extract values
        const rawMsisdn = values[columnIndices.msisdn] || '';
        const rawAmount = values[columnIndices.amount] || '0';
        const rawCurrency = columnIndices.currency !== -1 ? values[columnIndices.currency] : 'EUR';
        const rawStatus = columnIndices.status !== -1 ? values[columnIndices.status] : 'billed';
        const rawDate = columnIndices.date !== -1 ? values[columnIndices.date] : '';
        const rawTransactionId = columnIndices.transactionId !== -1 ? values[columnIndices.transactionId] : '';
        const rawProductCode = columnIndices.productCode !== -1 ? values[columnIndices.productCode] : '';
        const rawDescription = columnIndices.description !== -1 ? values[columnIndices.description] : '';
        // Article fields for creating unlocks
        const rawArticleId = columnIndices.articleId !== -1 ? values[columnIndices.articleId] : '';
        const rawArticleSlug = columnIndices.articleSlug !== -1 ? values[columnIndices.articleSlug] : '';

        // Validate MSISDN
        if (!rawMsisdn) {
          results.errors.push({ row: i + 1, error: 'Missing MSISDN' });
          results.rejected++;
          continue;
        }

        const normalizedMsisdn = normalizePhoneNumber(rawMsisdn);
        if (!isValidPhoneNumber(normalizedMsisdn)) {
          results.errors.push({ row: i + 1, error: `Invalid phone number: ${rawMsisdn}` });
          results.rejected++;
          continue;
        }

        // Parse amount (handle comma as decimal separator)
        const amountStr = rawAmount.replace(',', '.').replace(/[^0-9.]/g, '');
        let amount = parseFloat(amountStr) || 0;
        // Convert to cents if it looks like euros
        if (amount > 0 && amount < 100) {
          amount = Math.round(amount * 100);
        }

        // Parse date
        let eventTime = new Date();
        if (rawDate) {
          const parsed = new Date(rawDate);
          if (!isNaN(parsed.getTime())) {
            eventTime = parsed;
          }
        }

        // Map status
        const statusMap: Record<string, BillingStatus> = {
          success: 'billed',
          completed: 'billed',
          billed: 'billed',
          paid: 'billed',
          refund: 'refunded',
          refunded: 'refunded',
          chargeback: 'chargeback',
          failed: 'failed',
          cancelled: 'cancelled',
          pending: 'pending',
        };
        const status = statusMap[rawStatus.toLowerCase()] || 'billed';

        // Create raw row for audit
        const rawRowJson: Record<string, string> = {};
        header.forEach((h, idx) => {
          rawRowJson[h] = values[idx] || '';
        });

        // Generate transaction ID if not provided
        const transactionId = rawTransactionId || `import_${Date.now()}_${i}`;
        const isPaid = status === 'billed' || status === 'completed';

        // Create billing event
        try {
          await billingRepo.createBillingEvent({
            billingEventId: transactionId,
            msisdn: rawMsisdn,
            normalizedMsisdn,
            tenantId: brandId,
            source: sourceType === 'DIMOCO' ? 'DIMOCO_EXPORT' : sourceType === 'SMS' ? 'SMS_BILLING' : 'OTHER',
            amount,
            currency: rawCurrency || 'EUR',
            productCode: rawProductCode || undefined,
            serviceName: rawDescription || undefined,
            eventTime,
            status,
            rawRowJson,
            importBatchId: batchId,
            transactionId,
            articleId: rawArticleId || undefined,
            articleSlug: rawArticleSlug || undefined,
          });

          // Create/update user record
          const existingUser = await userRepo.findByMsisdn(normalizedMsisdn);
          if (!existingUser) {
            // Create new user with MSISDN
            await userRepo.createMsisdnUser({
              msisdn: rawMsisdn,
              ip: 'imported',
              userAgent: 'billing-import',
              page: '/',
              msisdnSource: 'billing_import',
            });
            console.log(`[Billing Import] Created new user for MSISDN: ${normalizedMsisdn.substring(0, 6)}****`);
          }

          // Upsert customer
          await customerRepo.upsert({
            msisdn: rawMsisdn,
            normalizedMsisdn,
            tenantId: brandId,
          });
          
          // Add billing amount to customer and convert to customer status if paid
          if (isPaid) {
            await customerRepo.addBillingAmount(normalizedMsisdn, amount);
            await customerRepo.convertToCustomer(normalizedMsisdn, amount);
          }

          // Create transaction record (merges with online transactions)
          try {
            await transactionsCollection.insertOne({
              transactionId,
              msisdn: rawMsisdn,
              normalizedMsisdn,
              amount,
              currency: rawCurrency || 'EUR',
              status: isPaid ? 'completed' : status,
              articleId: rawArticleId || null,
              articleSlug: rawArticleSlug || null,
              paymentProvider: 'import',
              importBatchId: batchId,
              createdAt: eventTime,
              processedAt: eventTime,
              metadata: {
                source: 'billing_import',
                originalRow: rawRowJson,
              },
            });
          } catch (txnError: unknown) {
            // Duplicate transaction is OK - it means we already have this transaction
            if ((txnError as { code?: number }).code !== 11000) {
              console.error('[Billing Import] Error creating transaction:', txnError);
            }
          }

          // Create unlock record if article info is provided and payment is successful
          if (isPaid && (rawArticleId || rawArticleSlug)) {
            try {
              const existingUnlock = await unlockRepo.findByTransactionId(transactionId);
              if (!existingUnlock) {
                await unlockRepo.create({
                  msisdn: rawMsisdn,
                  articleId: rawArticleId || rawArticleSlug, // Use slug as fallback ID
                  transactionId,
                  amount,
                  currency: rawCurrency || 'EUR',
                  status: 'completed',
                  paymentProvider: 'import',
                  metadata: {
                    source: 'billing_import',
                    articleSlug: rawArticleSlug,
                    importBatchId: batchId.toString(),
                    importedAt: new Date().toISOString(),
                  },
                });
                console.log(`[Billing Import] Created unlock for article ${rawArticleId || rawArticleSlug}`);
              }
            } catch (unlockError: unknown) {
              // Duplicate unlock is OK
              if ((unlockError as { code?: number }).code !== 11000) {
                console.error('[Billing Import] Error creating unlock:', unlockError);
              }
            }
          }

          results.accepted++;
        } catch (error: unknown) {
          // Check for duplicate
          if ((error as { code?: number }).code === 11000) {
            results.duplicates++;
          } else {
            results.errors.push({ row: i + 1, error: (error as Error).message || 'Unknown error' });
            results.rejected++;
          }
        }
      } catch (error) {
        results.errors.push({ row: i + 1, error: error instanceof Error ? error.message : 'Parse error' });
        results.rejected++;
      }
    }

    // Update batch with results
    await billingRepo.updateImportBatch(batchId, {
      accepted: results.accepted,
      rejected: results.rejected,
      duplicates: results.duplicates,
      errors: results.errors.slice(0, 100), // Limit stored errors
      status: results.errors.length > results.accepted ? 'failed' : 'completed',
      processingCompletedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      batchId: batchId.toString(),
      data: {
        ...results,
        errors: results.errors.slice(0, 20), // Limit returned errors
      },
    });
  } catch (error) {
    console.error('Billing import error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import billing data' },
      { status: 500 }
    );
  }
}

// Helper function to parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// GET - List import batches
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brandId = await getBrandId();
    const billingRepo = getBillingRepository(brandId);

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    const result = await billingRepo.listImportBatches({
      tenantId: brandId,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      batches: result.batches,
      total: result.total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error listing import batches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
