'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// Hidden identification page
// This page attempts to identify the user via MSISDN and tracks visits
export default function IdentificationPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'identified' | 'anonymous'>('loading');
  
  // Get optional parameters
  const redirect = searchParams.get('redirect');
  const bypass = searchParams.get('bypass');
  const msisdn = searchParams.get('msisdn');

  useEffect(() => {
    async function identify() {
      try {
        // Collect device information
        const deviceInfo = {
          screen: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          colorDepth: window.screen.colorDepth,
          pixelRatio: window.devicePixelRatio,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          cookiesEnabled: navigator.cookieEnabled,
        };

        // Get or create session ID
        let sessionId = localStorage.getItem('news_session');
        if (!sessionId) {
          sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          localStorage.setItem('news_session', sessionId);
        }

        // Send identification request
        const response = await fetch('/api/identify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            page: window.location.href,
            msisdn: msisdn || undefined,
            resolution: `${window.screen.width}x${window.screen.height}`,
            deviceInfo,
          }),
        });

        const data = await response.json();
        setStatus(data.identified ? 'identified' : 'anonymous');

        // Redirect if specified
        if (redirect) {
          const url = new URL(redirect, window.location.origin);
          if (bypass) {
            url.searchParams.set('bypass', bypass);
          }
          window.location.href = url.toString();
        }
      } catch (error) {
        console.error('Identification error:', error);
        setStatus('anonymous');
      }
    }

    identify();
  }, [redirect, bypass, msisdn]);

  // This page is intentionally minimal and not publicly visible
  // It's used for tracking and identification purposes
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      background: '#f5f5f5'
    }}>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        {status === 'loading' ? (
          <div>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid #ddd',
              borderTopColor: '#333',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#666' }}>Laden...</p>
          </div>
        ) : redirect ? (
          <p style={{ color: '#666' }}>Weiterleitung...</p>
        ) : (
          <p style={{ color: '#999', fontSize: '14px' }}>OK</p>
        )}
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
