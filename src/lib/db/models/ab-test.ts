import { ObjectId } from 'mongodb';

export type ABTestStatus = 'draft' | 'running' | 'paused' | 'completed';

export interface ABTestVariant {
  id: string; // 'control' | 'variant_a' | 'variant_b' ...
  name: string;
  weight: number; // 0-100, must sum to 100 across variants
  config: Record<string, unknown>; // Variant-specific overrides (headline, CTA, etc.)
  visitors: number;
  conversions: number;
}

export interface ABTest {
  _id?: ObjectId;
  tenantId: string;
  name: string;
  description?: string;
  landingPageSlug?: string; // Optional: scope test to a specific landing page
  status: ABTestStatus;
  variants: ABTestVariant[];
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
