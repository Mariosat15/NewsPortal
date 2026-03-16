/**
 * IP-to-Geo lookup using free ip-api.com service.
 * Reason: Free tier allows 45 requests/minute, sufficient for enriching
 * new sessions on arrival. Results are cached to minimize external calls.
 */

interface GeoResult {
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

// In-memory cache for geo results (IP -> GeoResult, TTL: 1 hour)
const geoCache = new Map<string, { data: GeoResult; expiresAt: number }>();
const GEO_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function lookupGeo(ip: string): Promise<GeoResult | null> {
  // Skip private/local IPs
  if (isPrivateIP(ip)) return null;

  // Check cache
  const cached = geoCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as`, {
      signal: AbortSignal.timeout(3000), // 3s timeout
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.status === 'fail') return null;

    const result: GeoResult = {
      country: data.country || '',
      countryCode: data.countryCode || '',
      region: data.region || '',
      regionName: data.regionName || '',
      city: data.city || '',
      zip: data.zip || '',
      lat: data.lat || 0,
      lon: data.lon || 0,
      timezone: data.timezone || '',
      isp: data.isp || '',
      org: data.org || '',
      as: data.as || '',
    };

    // Cache the result
    geoCache.set(ip, { data: result, expiresAt: Date.now() + GEO_CACHE_TTL });

    return result;
  } catch {
    return null;
  }
}

function isPrivateIP(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('fc00:') ||
    ip.startsWith('fd') ||
    ip.startsWith('fe80:')
  );
}

/**
 * Enrich a session with geo data. Returns the geo fields to add to the session.
 */
export async function enrichWithGeo(ip: string): Promise<Record<string, unknown> | null> {
  const geo = await lookupGeo(ip);
  if (!geo) return null;

  return {
    'geo.country': geo.country,
    'geo.countryCode': geo.countryCode,
    'geo.region': geo.regionName,
    'geo.city': geo.city,
    'geo.lat': geo.lat,
    'geo.lon': geo.lon,
    'geo.timezone': geo.timezone,
    'geo.isp': geo.isp,
    'geo.org': geo.org,
  };
}
