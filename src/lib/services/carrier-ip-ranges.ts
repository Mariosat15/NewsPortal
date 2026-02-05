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

// Default carrier IP ranges - can be overridden via admin settings
export const defaultCarrierIpRanges: CarrierInfo[] = [
  // Germany
  {
    name: 'Deutsche Telekom',
    code: '262-01',
    country: 'DE',
    ipRanges: [
      '80.187.0.0/16',
      '93.104.0.0/14',
      '217.0.0.0/13',
      '2.160.0.0/12',
    ],
  },
  {
    name: 'Vodafone DE',
    code: '262-02',
    country: 'DE',
    ipRanges: [
      '139.7.0.0/16',
      '178.0.0.0/11',
      '46.5.0.0/16',
    ],
  },
  {
    name: 'O2 Germany',
    code: '262-03',
    country: 'DE',
    ipRanges: [
      '37.24.0.0/14',
      '85.176.0.0/13',
      '176.199.0.0/16',
    ],
  },
  // Austria
  {
    name: 'A1 Telekom Austria',
    code: '232-01',
    country: 'AT',
    ipRanges: [
      '77.116.0.0/14',
      '91.113.0.0/16',
    ],
  },
  {
    name: 'Magenta Telekom AT',
    code: '232-03',
    country: 'AT',
    ipRanges: [
      '84.112.0.0/12',
    ],
  },
  // Switzerland
  {
    name: 'Swisscom',
    code: '228-01',
    country: 'CH',
    ipRanges: [
      '178.197.0.0/16',
      '31.164.0.0/14',
    ],
  },
  // Cyprus
  {
    name: 'PrimeTel',
    code: '280-01',
    country: 'CY',
    ipRanges: [
      '82.102.0.0/16',
      '82.116.0.0/14',
      '217.175.0.0/16',  // Additional PrimeTel range
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
