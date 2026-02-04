import { NextRequest, NextResponse } from 'next/server';

// Mock payment page for development/demo
// In production, this would be replaced by actual DIMOCO integration
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
      <strong>Demo-Modus:</strong> Dies ist eine simulierte Zahlungsseite.
    </div>
    
    <h1>Zahlung bestätigen</h1>
    <div class="amount">${((parseInt(amount || '99', 10)) / 100).toFixed(2)} EUR</div>
    <div class="description">${decodeURIComponent(description || 'Artikel freischalten')}</div>
    
    <form id="paymentForm">
      <div class="form-group">
        <label for="phone">Handynummer</label>
        <input type="tel" id="phone" name="phone" placeholder="+49 123 456 7890" required 
               pattern="[+]?[0-9\\s-]{10,}" value="+49 172 1234567">
      </div>
      
      <button type="submit" class="btn btn-primary">
        Jetzt bezahlen
      </button>
      
      <button type="button" class="btn btn-secondary" onclick="handleCancel()">
        Abbrechen
      </button>
    </form>
    
    <div class="secure">
      🔒 Sichere Zahlung über Ihre Handyrechnung
    </div>
  </div>

  <script>
    const form = document.getElementById('paymentForm');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const phone = document.getElementById('phone').value;
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verarbeitung...';
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Build callback URL - use the dynamic callback base passed from initiate
      // Note: metadata is already URL-encoded, so we build the URL manually to avoid double-encoding
      const baseParams = new URLSearchParams({
        transactionId: '${transactionId}',
        status: 'success',
        msisdn: phone.replace(/[^0-9+]/g, ''),
        amount: '${amount}',
        articleId: '${articleId}',
        returnUrl: '${successUrl}'
      }).toString();
      
      // Append metadata separately (it's already URL-encoded)
      const metadataParam = '${metadata || ''}';
      const fullCallbackUrl = '${callbackBase}' + '?' + baseParams + (metadataParam ? '&metadata=' + metadataParam : '');
      
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
