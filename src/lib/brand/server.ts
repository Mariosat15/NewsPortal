import { cookies, headers } from 'next/headers';
import { getBrandConfig, getBrandIdFromDomain, type BrandConfig } from './config';

// Get brand ID from request context (server-side)
export async function getBrandId(): Promise<string> {
  try {
    // Try to get from cookie first
    const cookieStore = await cookies();
    const brandCookie = cookieStore.get('BRAND_ID');
    if (brandCookie?.value) {
      return brandCookie.value;
    }

    // Fallback to host header
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    return getBrandIdFromDomain(host);
  } catch {
    // Fallback for static generation
    return process.env.BRAND_ID || 'default';
  }
}

// Get brand config for server components
export async function getServerBrandConfig(): Promise<BrandConfig> {
  const brandId = await getBrandId();
  return getBrandConfig(brandId);
}

// Utility to get brand ID synchronously from environment (for API routes)
export function getBrandIdSync(): string {
  return process.env.BRAND_ID || 'default';
}
