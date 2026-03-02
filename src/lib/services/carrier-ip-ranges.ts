/**
 * Carrier IP ranges configuration for network type detection
 * 
 * These IP ranges identify mobile carrier networks (4G/5G)
 * Users on these networks can have their MSISDN detected via header enrichment
 */

export interface CarrierInfo {
  name: string;
  code: string;  // MCC-MNC or carrier identifier
  country: string;
  ipRanges: string[];  // CIDR notation
}

// Default carrier IP ranges — used for ADVISORY detection only.
// IMPORTANT: These ranges are never used to block purchases. DIMOCO handles
// the actual carrier verification. This list provides a UX hint to show
// "Connected to <carrier>" or "Tip: use mobile data".
// Ranges sourced from BGP/ASN data for major DACH + CY mobile operators.
export const defaultCarrierIpRanges: CarrierInfo[] = [
  // ─── Germany ───────────────────────────────────────────────
  {
    name: 'Deutsche Telekom',
    code: '262-01',
    country: 'DE',
    ipRanges: [
      '2.160.0.0/12',      // 2.160–2.175.x.x
      '5.56.0.0/14',       // 5.56–5.59.x.x
      '80.187.0.0/16',
      '91.64.0.0/13',      // 91.64–91.71.x.x
      '93.104.0.0/14',     // 93.104–93.107.x.x
      '217.0.0.0/13',      // 217.0–217.7.x.x
    ],
  },
  {
    name: 'Vodafone DE',
    code: '262-02',
    country: 'DE',
    ipRanges: [
      '31.16.0.0/12',      // 31.16–31.31.x.x
      '46.5.0.0/16',
      '77.20.0.0/14',      // 77.20–77.23.x.x
      '80.130.0.0/15',     // 80.130–80.131.x.x
      '92.192.0.0/11',     // 92.192–92.223.x.x
      '109.40.0.0/13',     // 109.40–109.47.x.x ← YOUR IP 109.42.118.192
      '139.7.0.0/16',
      '178.0.0.0/11',      // 178.0–178.31.x.x
      '188.96.0.0/12',     // 188.96–188.111.x.x
    ],
  },
  {
    name: 'O2 Germany (Telefónica)',
    code: '262-03',
    country: 'DE',
    ipRanges: [
      '37.24.0.0/14',      // 37.24–37.27.x.x
      '46.223.0.0/16',
      '85.176.0.0/13',     // 85.176–85.183.x.x
      '176.198.0.0/15',    // 176.198–176.199.x.x
      '185.23.0.0/22',
    ],
  },
  {
    name: '1&1 / Drillisch DE',
    code: '262-07',
    country: 'DE',
    ipRanges: [
      '87.128.0.0/10',     // 87.128–87.191.x.x (1&1/United Internet mobile)
    ],
  },

  // ─── Austria ───────────────────────────────────────────────
  {
    name: 'A1 Telekom Austria',
    code: '232-01',
    country: 'AT',
    ipRanges: [
      '77.116.0.0/14',     // 77.116–77.119.x.x
      '91.113.0.0/16',
      '194.48.128.0/17',
    ],
  },
  {
    name: 'Magenta Telekom AT',
    code: '232-03',
    country: 'AT',
    ipRanges: [
      '84.112.0.0/12',     // 84.112–84.127.x.x
      '213.162.64.0/19',
    ],
  },
  {
    name: 'Drei AT (Hutchison)',
    code: '232-05',
    country: 'AT',
    ipRanges: [
      '178.115.0.0/16',
      '188.20.0.0/14',     // 188.20–188.23.x.x
    ],
  },

  // ─── Switzerland ───────────────────────────────────────────
  {
    name: 'Swisscom',
    code: '228-01',
    country: 'CH',
    ipRanges: [
      '31.164.0.0/14',     // 31.164–31.167.x.x
      '178.197.0.0/16',
      '77.56.0.0/14',      // 77.56–77.59.x.x
    ],
  },
  {
    name: 'Sunrise CH',
    code: '228-02',
    country: 'CH',
    ipRanges: [
      '85.0.0.0/11',       // 85.0–85.31.x.x (partially mobile)
      '178.82.0.0/15',     // 178.82–178.83.x.x
    ],
  },
  {
    name: 'Salt CH',
    code: '228-03',
    country: 'CH',
    ipRanges: [
      '85.195.0.0/16',
      '109.164.0.0/16',
    ],
  },

  // ─── Cyprus ────────────────────────────────────────────────
  {
    name: 'PrimeTel',
    code: '280-01',
    country: 'CY',
    ipRanges: [
      '82.102.0.0/16',
      '82.116.0.0/14',
      '217.175.0.0/16',
    ],
  },
  {
    name: 'Cyta',
    code: '280-02',
    country: 'CY',
    ipRanges: [
      '212.31.64.0/19',
      '195.14.128.0/19',
    ],
  },
  {
    name: 'Epic (MTN Cyprus)',
    code: '280-10',
    country: 'CY',
    ipRanges: [
      '46.198.0.0/16',
      '109.69.0.0/16',
    ],
  },
];

/**
 * Convert IP address string to numeric value for range checking
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.');
  if (parts.length !== 4) return 0;
  
  return parts.reduce((acc, part) => {
    return (acc << 8) + parseInt(part, 10);
  }, 0) >>> 0;
}

/**
 * Parse CIDR notation to get start and end IP numbers
 */
function parseCidr(cidr: string): { start: number; end: number } {
  const [ip, prefix] = cidr.split('/');
  const prefixBits = parseInt(prefix, 10);
  const mask = ~((1 << (32 - prefixBits)) - 1) >>> 0;
  const ipNum = ipToNumber(ip);
  
  return {
    start: (ipNum & mask) >>> 0,
    end: ((ipNum & mask) | (~mask >>> 0)) >>> 0,
  };
}

/**
 * Check if an IP address is within a CIDR range
 */
function isIpInRange(ip: string, cidr: string): boolean {
  const ipNum = ipToNumber(ip);
  const range = parseCidr(cidr);
  return ipNum >= range.start && ipNum <= range.end;
}

export interface NetworkDetectionResult {
  isMobileNetwork: boolean;
  carrier?: CarrierInfo;
  networkType: 'MOBILE_DATA' | 'WIFI' | 'UNKNOWN';
}

/**
 * Detect if an IP address belongs to a mobile carrier network
 */
export function detectNetworkType(
  ip: string, 
  carrierRanges: CarrierInfo[] = defaultCarrierIpRanges
): NetworkDetectionResult {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      isMobileNetwork: false,
      networkType: 'UNKNOWN',
    };
  }

  for (const carrier of carrierRanges) {
    for (const range of carrier.ipRanges) {
      if (isIpInRange(ip, range)) {
        return {
          isMobileNetwork: true,
          carrier,
          networkType: 'MOBILE_DATA',
        };
      }
    }
  }

  // If no mobile carrier match, assume WiFi/broadband
  return {
    isMobileNetwork: false,
    networkType: 'WIFI',
  };
}

/**
 * Get carrier info by code
 */
export function getCarrierByCode(
  code: string, 
  carrierRanges: CarrierInfo[] = defaultCarrierIpRanges
): CarrierInfo | undefined {
  return carrierRanges.find(c => c.code === code);
}

/**
 * Get all carriers for a country
 */
export function getCarriersByCountry(
  country: string, 
  carrierRanges: CarrierInfo[] = defaultCarrierIpRanges
): CarrierInfo[] {
  return carrierRanges.filter(c => c.country === country);
}

/**
 * Validate CIDR notation
 */
export function isValidCidr(cidr: string): boolean {
  const parts = cidr.split('/');
  if (parts.length !== 2) return false;
  
  const ip = parts[0];
  const prefix = parseInt(parts[1], 10);
  
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;
  
  const ipParts = ip.split('.');
  if (ipParts.length !== 4) return false;
  
  return ipParts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

/**
 * Merge custom carrier ranges with defaults
 */
export function mergeCarrierRanges(
  customRanges: CarrierInfo[], 
  defaults: CarrierInfo[] = defaultCarrierIpRanges
): CarrierInfo[] {
  const merged = new Map<string, CarrierInfo>();
  
  // Add defaults first
  for (const carrier of defaults) {
    merged.set(carrier.code, carrier);
  }
  
  // Override/add custom ranges
  for (const carrier of customRanges) {
    merged.set(carrier.code, carrier);
  }
  
  return Array.from(merged.values());
}
