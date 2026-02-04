/**
 * Device Fingerprint Utility
 * Captures browser, device, and environment information for fraud prevention
 */

export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenResolution: string;
  colorDepth: string;
  timezone: string;
  language: string;
  userAgent: string;
  platform: string;
  cookiesEnabled: boolean;
  doNotTrack: boolean;
  touchSupport: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  gpu?: string;
  canvasFingerprint?: string;
  webglFingerprint?: string;
  deviceFingerprint: string;
  collectedAt: string;
}

/**
 * Get browser name and version from user agent
 */
function getBrowserInfo(ua: string): { name: string; version: string } {
  const browsers = [
    { name: 'Chrome', regex: /Chrome\/(\d+\.\d+)/ },
    { name: 'Firefox', regex: /Firefox\/(\d+\.\d+)/ },
    { name: 'Safari', regex: /Version\/(\d+\.\d+).*Safari/ },
    { name: 'Edge', regex: /Edg\/(\d+\.\d+)/ },
    { name: 'Opera', regex: /OPR\/(\d+\.\d+)/ },
    { name: 'IE', regex: /MSIE (\d+\.\d+)/ },
  ];

  for (const browser of browsers) {
    const match = ua.match(browser.regex);
    if (match) {
      return { name: browser.name, version: match[1] };
    }
  }

  return { name: 'Unknown', version: 'Unknown' };
}

/**
 * Get OS name and version from user agent
 */
function getOSInfo(ua: string): { name: string; version: string } {
  if (ua.includes('Windows NT 10.0')) return { name: 'Windows', version: '10/11' };
  if (ua.includes('Windows NT 6.3')) return { name: 'Windows', version: '8.1' };
  if (ua.includes('Windows NT 6.2')) return { name: 'Windows', version: '8' };
  if (ua.includes('Windows NT 6.1')) return { name: 'Windows', version: '7' };
  if (ua.includes('Mac OS X')) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    return { name: 'macOS', version: match ? match[1].replace('_', '.') : 'Unknown' };
  }
  if (ua.includes('Android')) {
    const match = ua.match(/Android (\d+\.?\d*)/);
    return { name: 'Android', version: match ? match[1] : 'Unknown' };
  }
  if (ua.includes('iPhone') || ua.includes('iPad')) {
    const match = ua.match(/OS (\d+_\d+)/);
    return { name: 'iOS', version: match ? match[1].replace('_', '.') : 'Unknown' };
  }
  if (ua.includes('Linux')) return { name: 'Linux', version: 'Unknown' };
  
  return { name: 'Unknown', version: 'Unknown' };
}

/**
 * Generate canvas fingerprint
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = 200;
    canvas.height = 50;

    // Draw text with various styles
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas', 4, 17);

    return canvas.toDataURL().slice(0, 100); // Truncate for storage
  } catch {
    return '';
  }
}

/**
 * Get WebGL renderer info
 */
function getWebGLInfo(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) return '';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return `${vendor}~${renderer}`;
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Generate a unique fingerprint hash
 */
function generateHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Collect all device information
 */
export function collectDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      browser: 'Server',
      browserVersion: 'N/A',
      os: 'Server',
      osVersion: 'N/A',
      screenResolution: 'N/A',
      colorDepth: 'N/A',
      timezone: 'N/A',
      language: 'N/A',
      userAgent: 'Server',
      platform: 'Server',
      cookiesEnabled: false,
      doNotTrack: false,
      touchSupport: false,
      deviceFingerprint: 'server',
      collectedAt: new Date().toISOString(),
    };
  }

  const ua = navigator.userAgent;
  const browserInfo = getBrowserInfo(ua);
  const osInfo = getOSInfo(ua);
  const gpu = getWebGLInfo();
  const canvasFingerprint = getCanvasFingerprint();

  // Collect all data for fingerprint
  const fingerprintData = [
    ua,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.platform,
    gpu,
    canvasFingerprint,
  ].join('|');

  const deviceInfo: DeviceInfo = {
    browser: browserInfo.name,
    browserVersion: browserInfo.version,
    os: osInfo.name,
    osVersion: osInfo.version,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: `${screen.colorDepth} bit`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    userAgent: ua,
    platform: navigator.platform,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === '1',
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    deviceFingerprint: generateHash(fingerprintData),
    collectedAt: new Date().toISOString(),
  };

  // Add optional properties
  if ('deviceMemory' in navigator) {
    deviceInfo.deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  }
  if ('hardwareConcurrency' in navigator) {
    deviceInfo.hardwareConcurrency = navigator.hardwareConcurrency;
  }
  if (gpu) {
    deviceInfo.gpu = gpu;
  }
  if (canvasFingerprint) {
    deviceInfo.canvasFingerprint = canvasFingerprint;
  }

  return deviceInfo;
}

/**
 * Store device info in session storage for payment flow
 */
export function storeDeviceInfo(): DeviceInfo {
  const deviceInfo = collectDeviceInfo();
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('device_fingerprint', JSON.stringify(deviceInfo));
  }
  return deviceInfo;
}

/**
 * Get stored device info
 */
export function getStoredDeviceInfo(): DeviceInfo | null {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem('device_fingerprint');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}
