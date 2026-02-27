/**
 * Cloudflare API integration for automated zone setup.
 *
 * Automates:
 *  1. Zone creation (adding the domain to Cloudflare)
 *  2. DNS record creation (A for apex, CNAME for www)
 *  3. SSL/TLS mode → Full (Strict)
 *  4. Always Use HTTPS → on
 *  5. Minimum TLS version → 1.2
 *
 * After deployment the user must manually update nameservers
 * at their domain registrar to the ones returned by Cloudflare.
 */

const CF_API = 'https://api.cloudflare.com/client/v4';

// ── helpers ──────────────────────────────────────────────────────────

function headers(apiToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  };
}

async function cfFetch<T = unknown>(
  apiToken: string,
  path: string,
  init?: RequestInit
): Promise<{ success: boolean; result: T; errors: { message: string }[] }> {
  const res = await fetch(`${CF_API}${path}`, {
    ...init,
    headers: headers(apiToken),
  });
  const data = await res.json();
  return data as { success: boolean; result: T; errors: { message: string }[] };
}

// ── public API ───────────────────────────────────────────────────────

export interface CloudflareZoneResult {
  zoneId: string;
  nameservers: string[];
  status: string;
}

/**
 * Verify that the given API token is valid and has the required permissions.
 */
export async function verifyToken(apiToken: string): Promise<boolean> {
  try {
    const res = await cfFetch(apiToken, '/user/tokens/verify');
    return res.success;
  } catch {
    return false;
  }
}

/**
 * Create a new zone (domain) in Cloudflare.
 * Returns the zone ID and the assigned nameservers.
 */
export async function createZone(
  apiToken: string,
  accountId: string,
  domain: string
): Promise<CloudflareZoneResult> {
  // Check if zone already exists
  const existing = await cfFetch<{ id: string; name_servers: string[]; status: string }[]>(
    apiToken,
    `/zones?name=${encodeURIComponent(domain)}&account.id=${accountId}`
  );

  if (existing.success && existing.result.length > 0) {
    const zone = existing.result[0];
    return {
      zoneId: zone.id,
      nameservers: zone.name_servers,
      status: zone.status,
    };
  }

  // Create new zone
  const res = await cfFetch<{ id: string; name_servers: string[]; status: string }>(
    apiToken,
    '/zones',
    {
      method: 'POST',
      body: JSON.stringify({
        name: domain,
        account: { id: accountId },
        jump_start: true, // Attempt to auto-scan existing DNS records
      }),
    }
  );

  if (!res.success) {
    throw new Error(`Failed to create Cloudflare zone: ${res.errors.map(e => e.message).join(', ')}`);
  }

  return {
    zoneId: res.result.id,
    nameservers: res.result.name_servers,
    status: res.result.status,
  };
}

/**
 * Create the required DNS records (A for apex, CNAME for www).
 * Existing records with the same name/type are updated instead.
 */
export async function createDnsRecords(
  apiToken: string,
  zoneId: string,
  domain: string,
  serverIp: string
): Promise<void> {
  // Helper: find existing record
  async function findRecord(type: string, name: string) {
    const res = await cfFetch<{ id: string }[]>(
      apiToken,
      `/zones/${zoneId}/dns_records?type=${type}&name=${encodeURIComponent(name)}`
    );
    return res.success && res.result.length > 0 ? res.result[0] : null;
  }

  // A record for apex → server IP (proxied)
  const existingA = await findRecord('A', domain);
  if (existingA) {
    await cfFetch(apiToken, `/zones/${zoneId}/dns_records/${existingA.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ type: 'A', name: '@', content: serverIp, proxied: true, ttl: 1 }),
    });
  } else {
    const aRes = await cfFetch(apiToken, `/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify({ type: 'A', name: '@', content: serverIp, proxied: true, ttl: 1 }),
    });
    if (!aRes.success) {
      throw new Error(`Failed to create A record: ${aRes.errors.map(e => e.message).join(', ')}`);
    }
  }

  // CNAME record for www → domain (proxied)
  const existingCname = await findRecord('CNAME', `www.${domain}`);
  if (existingCname) {
    await cfFetch(apiToken, `/zones/${zoneId}/dns_records/${existingCname.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ type: 'CNAME', name: 'www', content: domain, proxied: true, ttl: 1 }),
    });
  } else {
    const cnameRes = await cfFetch(apiToken, `/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify({ type: 'CNAME', name: 'www', content: domain, proxied: true, ttl: 1 }),
    });
    if (!cnameRes.success) {
      throw new Error(`Failed to create CNAME record: ${cnameRes.errors.map(e => e.message).join(', ')}`);
    }
  }
}

/**
 * Apply recommended security settings to the zone:
 * - SSL mode: Full (Strict)
 * - Always Use HTTPS: on
 * - Minimum TLS version: 1.2
 * - Security level: medium
 * - Browser Integrity Check: on
 */
export async function configureSecuritySettings(
  apiToken: string,
  zoneId: string
): Promise<void> {
  const settings: [string, unknown][] = [
    ['ssl', { value: 'strict' }],
    ['always_use_https', { value: 'on' }],
    ['min_tls_version', { value: '1.2' }],
    ['security_level', { value: 'medium' }],
    ['browser_check', { value: 'on' }],
  ];

  for (const [setting, body] of settings) {
    const res = await cfFetch(apiToken, `/zones/${zoneId}/settings/${setting}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    if (!res.success) {
      // Non-fatal: log but don't throw — some settings may not be available on free plan
      console.warn(`Cloudflare setting ${setting} warning:`, res.errors);
    }
  }
}

/**
 * Full Cloudflare setup orchestrator.
 * Returns the nameservers the user needs to configure at their registrar.
 */
export async function setupCloudflare(
  apiToken: string,
  accountId: string,
  domain: string,
  serverIp: string,
  onLog: (msg: string) => void
): Promise<{ nameservers: string[]; zoneId: string }> {
  // 1. Verify token
  onLog('Verifying Cloudflare API token...');
  const valid = await verifyToken(apiToken);
  if (!valid) {
    throw new Error('Invalid Cloudflare API token. Please check your token permissions.');
  }
  onLog('API token verified ✓');

  // 2. Create zone
  onLog(`Adding domain ${domain} to Cloudflare...`);
  const zone = await createZone(apiToken, accountId, domain);
  onLog(`Zone created (ID: ${zone.zoneId.substring(0, 8)}..., status: ${zone.status})`);

  // 3. Create DNS records
  onLog(`Creating DNS records (A: ${domain} → ${serverIp}, CNAME: www → ${domain})...`);
  await createDnsRecords(apiToken, zone.zoneId, domain, serverIp);
  onLog('DNS records configured ✓');

  // 4. Configure security settings
  onLog('Applying security settings (SSL: Full Strict, HTTPS redirect, TLS 1.2+)...');
  await configureSecuritySettings(apiToken, zone.zoneId);
  onLog('Security settings applied ✓');

  // 5. Return nameservers
  onLog(`Cloudflare nameservers assigned: ${zone.nameservers.join(', ')}`);
  return { nameservers: zone.nameservers, zoneId: zone.zoneId };
}

/**
 * Cloudflare IPv4 ranges for Nginx real_ip_from directives.
 * Source: https://www.cloudflare.com/ips-v4/
 * These should be periodically reviewed for changes.
 */
export const CLOUDFLARE_IPV4_RANGES = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
];

export const CLOUDFLARE_IPV6_RANGES = [
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
];
