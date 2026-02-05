import { NextRequest, NextResponse } from 'next/server';

// Mock payment page for development/demo
// In production, DIMOCO gets MSISDN directly from carrier - user cannot choose their number
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const transactionId = searchParams.get('transactionId');
  const amount = searchParams.get('amount');
  const description = searchParams.get('description');
  const successUrl = searchParams.get('successUrl');
  const cancelUrl = searchParams.get('cancelUrl');
  const callbackUrl = searchParams.get('callbackUrl');
  const metadata = searchParams.get('metadata'); // Device fingerprint data
  const articleId = searchParams.get('articleId'); // Article ID passed directly
  
  // Parse callback URL to get the base for building the full callback
  const callbackBase = callbackUrl || '/api/payment/dimoco/callback';
  
  // Get MSISDN from cookie (detected by middleware or previous payment)
  // In PRODUCTION: Carrier provides this automatically via header enrichment
  // In MOCK: We use stored MSISDN or generate a test one based on IP
  const storedMsisdn = request.cookies.get('user_msisdn')?.value;
  const sessionId = request.cookies.get('news_session')?.value || transactionId;
  
  // Generate a consistent test MSISDN based on session/IP if not stored
  // This simulates carrier detection - same session = same MSISDN
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';
  
  // Create a consistent MSISDN from IP (simulates carrier detection)
  const ipHash = ipAddress.split('.').reduce((acc, octet) => acc + parseInt(octet, 10), 0);
  const generatedMsisdn = `+49170${(1000000 + (ipHash * 1234) % 9000000).toString()}`;
  
  // Use stored MSISDN if available, otherwise use generated one
  const detectedMsisdn = storedMsisdn || generatedMsisdn;
  const msisdnSource = storedMsisdn ? 'stored' : 'generated';
  
  console.log('[Payment Mock] MSISDN detection:', { 
    storedMsisdn: storedMsisdn ? storedMsisdn.substring(0, 6) + '****' : null,
    generatedMsisdn,
    source: msisdnSource,
    ipAddress 
  });
  
  // Parse metadata for display/logging
  let deviceInfo: Record<string, string> = {};
  if (metadata) {
    try {
      deviceInfo = JSON.parse(decodeURIComponent(metadata));
    } catch (e) {
      console.error('Failed to parse metadata:', e);
    }
  }

  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DIMOCO Payment - Demo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 32px;
      max-width: 400px;
      width: 100%;
    }
    .logo {
      text-align: center;
      margin-bottom: 24px;
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
    }
    h1 {
      font-size: 20px;
      margin-bottom: 8px;
      color: #1a1a1a;
    }
    .amount {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 16px;
    }
    .description {
      color: #666;
      font-size: 14px;
      margin-bottom: 24px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 6px;
      color: #333;
    }
    input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.2s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    .btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin-bottom: 12px;
    }
    .btn-secondary {
      background: #f0f0f0;
      color: #666;
    }
    .secure {
      text-align: center;
      font-size: 12px;
      color: #999;
      margin-top: 16px;
    }
    .demo-note {
      background: #fff3cd;
      color: #856404;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      margin-bottom: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">DIMOCO pay:smart</div>
    
    <div class="demo-note">
      <strong>Demo-Modus:</strong> Ihre Nummer wurde automatisch erkannt (wie bei echtem Carrier Billing).
    </div>
    
    <h1>Zahlung bestätigen</h1>
    <div class="amount">${(parseFloat(amount || '99') / 100).toFixed(2)} EUR</div>
    <div class="description">${decodeURIComponent(description || 'Artikel freischalten')}</div>
    
    <form id="paymentForm">
      <div class="form-group">
        <label for="phone">Erkannte Handynummer</label>
        <input type="tel" id="phone" name="phone" readonly
               value="${detectedMsisdn}" 
               style="background: #f0f0f0; cursor: not-allowed;">
        <div style="font-size: 11px; color: #888; margin-top: 4px;">
          📱 ${msisdnSource === 'stored' ? 'Von Ihrem Gerät erkannt' : 'Von Mobilfunknetz erkannt'} - 
          <span style="color: #28a745;">Kann nicht geändert werden</span>
        </div>
      </div>
      
      <button type="submit" class="btn btn-primary">
        Jetzt bezahlen (${(parseFloat(amount || '99') / 100).toFixed(2)} €)
      </button>
      
      <button type="button" class="btn btn-secondary" onclick="handleCancel()">
        Abbrechen
      </button>
    </form>
    
    <div class="secure">
      🔒 Sichere Zahlung über Ihre Handyrechnung<br>
      <span style="font-size: 10px; color: #666;">
        Der Betrag wird Ihrer Mobilfunkrechnung belastet.
      </span>
    </div>
  </div>

  <script>
    const form = document.getElementById('paymentForm');
    // MSISDN is fixed - detected from carrier/session (cannot be changed by user)
    const detectedMsisdn = '${detectedMsisdn}';
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verarbeitung...';
      
      // Simulate payment processing (carrier verification)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Build callback URL with the DETECTED MSISDN (not user input)
      // In production, DIMOCO returns this from carrier - cannot be faked
      const amountCents = '${amount || '99'}';
      const baseParams = new URLSearchParams({
        transactionId: '${transactionId}',
        status: 'success',
        msisdn: detectedMsisdn,  // Use detected MSISDN, not user input!
        amountCents: amountCents,
        articleId: '${articleId}',
        returnUrl: '${successUrl}'
      }).toString();
      
      // Append metadata separately (it's already URL-encoded)
      const metadataParam = '${metadata || ''}';
      const fullCallbackUrl = '${callbackBase}' + '?' + baseParams + (metadataParam ? '&metadata=' + metadataParam : '');
      
      console.log('[Payment Mock] MSISDN (carrier-detected):', detectedMsisdn);
      console.log('[Payment Mock] Callback URL:', fullCallbackUrl);
      window.location.href = fullCallbackUrl;
    });
    
    function handleCancel() {
      window.location.href = '${cancelUrl}';
    }
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
