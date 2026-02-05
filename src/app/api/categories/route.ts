import { NextResponse } from 'next/server';
import { getBrandIdSync } from '@/lib/brand/server';
import { getCollection } from '@/lib/db/mongodb';

export const dynamic = 'force-dynamic';

// Public API to get enabled categories for frontend use
export async function GET() {
  try {
    const brandId = getBrandIdSync();
    const collection = await getCollection(brandId, 'settings');
    
    // Get categories from settings collection where key = 'categories'
    const categoriesDoc = await collection.findOne({ key: 'categories' });
    
    if (!categoriesDoc?.value || !Array.isArray(categoriesDoc.value) || categoriesDoc.value.length === 0) {
      // Return default categories if none are configured
      return NextResponse.json({
        categories: getDefaultCategories()
      });
    }
    
    // Filter to only enabled categories and sort by order
    const enabledCategories = categoriesDoc.value
      .filter((c: { enabled?: boolean }) => c.enabled !== false)
      .sort((a: { order?: number }, b: { order?: number }) => (a.order || 0) - (b.order || 0))
      .map((c: { id: string; name: string; slug: string; description?: string; color?: string; icon?: string; contentTypes?: string[] }) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        color: c.color || '#3b82f6',
        icon: c.icon || 'newspaper',
        contentTypes: c.contentTypes || ['news'],
      }));
    
    return NextResponse.json({
      categories: enabledCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return default categories on error
    return NextResponse.json({
      categories: getDefaultCategories()
    });
  }
}

function getDefaultCategories() {
  // Return only ENABLED categories by default (matches seed.ts)
  return [
    { id: '1', name: 'News', slug: 'news', description: 'Breaking news and current events', color: '#3b82f6', icon: 'news', contentTypes: ['news', 'analysis'] },
    { id: '2', name: 'Technology', slug: 'technology', description: 'Tech news, gadgets, and innovations', color: '#8b5cf6', icon: 'technology', contentTypes: ['news', 'review', 'guide'] },
    { id: '3', name: 'Health', slug: 'health', description: 'Health tips, wellness, and medical news', color: '#22c55e', icon: 'health', contentTypes: ['news', 'guide', 'listicle'] },
    { id: '4', name: 'Finance', slug: 'finance', description: 'Financial news, investing, and money tips', color: '#f97316', icon: 'finance', contentTypes: ['news', 'analysis', 'guide'] },
    { id: '5', name: 'Sports', slug: 'sports', description: 'Sports news, scores, and highlights', color: '#ef4444', icon: 'sports', contentTypes: ['news', 'analysis'] },
    { id: '6', name: 'Lifestyle', slug: 'lifestyle', description: 'Lifestyle, trends, and living tips', color: '#ec4899', icon: 'lifestyle', contentTypes: ['guide', 'listicle', 'review'] },
    { id: '7', name: 'Entertainment', slug: 'entertainment', description: 'Movies, music, and celebrity news', color: '#6366f1', icon: 'entertainment', contentTypes: ['news', 'review', 'interview'] },
  ];
}
