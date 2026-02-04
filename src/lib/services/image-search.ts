import OpenAI from 'openai';

export interface ImageSearchResult {
  url: string;
  source: string;
  photographer?: string;
  photographerUrl?: string;
  alt?: string;
}

export interface ImageSourceConfig {
  unsplash?: {
    enabled: boolean;
    accessKey: string;
  };
  pexels?: {
    enabled: boolean;
    apiKey: string;
  };
  pixabay?: {
    enabled: boolean;
    apiKey: string;
  };
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate search keywords from article title and content using AI
export async function generateImageKeywords(
  title: string,
  teaser: string,
  category: string
): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a visual content specialist. Generate 3-5 specific, visual search keywords for finding the perfect stock photo for a news article. 
Focus on concrete, visual elements that would make compelling imagery.
Return ONLY a JSON array of keywords, nothing else.
Example: ["business meeting", "corporate office", "handshake"]`
        },
        {
          role: 'user',
          content: `Article Title: ${title}
Teaser: ${teaser}
Category: ${category}

Generate visual search keywords for this article's featured image.`
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content || '[]';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [category, title.split(' ').slice(0, 3).join(' ')];
  } catch (error) {
    console.error('Error generating image keywords:', error);
    return [category];
  }
}

// Search Unsplash for images
async function searchUnsplash(
  keywords: string[],
  accessKey: string
): Promise<ImageSearchResult[]> {
  try {
    const query = keywords.join(' ');
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Unsplash API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.results?.map((photo: {
      urls: { regular: string };
      user: { name: string; links: { html: string } };
      alt_description?: string;
    }) => ({
      url: photo.urls.regular,
      source: 'unsplash',
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      alt: photo.alt_description,
    })) || [];
  } catch (error) {
    console.error('Unsplash search error:', error);
    return [];
  }
}

// Search Pexels for images
async function searchPexels(
  keywords: string[],
  apiKey: string
): Promise<ImageSearchResult[]> {
  try {
    const query = keywords.join(' ');
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error('Pexels API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.photos?.map((photo: {
      src: { large: string };
      photographer: string;
      photographer_url: string;
      alt?: string;
    }) => ({
      url: photo.src.large,
      source: 'pexels',
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      alt: photo.alt,
    })) || [];
  } catch (error) {
    console.error('Pexels search error:', error);
    return [];
  }
}

// Search Pixabay for images
async function searchPixabay(
  keywords: string[],
  apiKey: string
): Promise<ImageSearchResult[]> {
  try {
    const query = keywords.join(' ');
    const response = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&per_page=5&image_type=photo&orientation=horizontal&min_width=800`
    );

    if (!response.ok) {
      console.error('Pixabay API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.hits?.map((photo: {
      largeImageURL: string;
      user: string;
      pageURL: string;
      tags?: string;
    }) => ({
      url: photo.largeImageURL,
      source: 'pixabay',
      photographer: photo.user,
      photographerUrl: photo.pageURL,
      alt: photo.tags,
    })) || [];
  } catch (error) {
    console.error('Pixabay search error:', error);
    return [];
  }
}

// Main function to search for images across all configured sources
export async function searchImages(
  title: string,
  teaser: string,
  category: string,
  config?: ImageSourceConfig
): Promise<ImageSearchResult | null> {
  // Generate AI-powered keywords
  const keywords = await generateImageKeywords(title, teaser, category);
  console.log(`[ImageSearch] Keywords for "${title.slice(0, 50)}...":`, keywords);

  const results: ImageSearchResult[] = [];

  // Use environment variables if no config provided
  const unsplashKey = config?.unsplash?.accessKey || process.env.UNSPLASH_ACCESS_KEY;
  const pexelsKey = config?.pexels?.apiKey || process.env.PEXELS_API_KEY;
  const pixabayKey = config?.pixabay?.apiKey || process.env.PIXABAY_API_KEY;

  // Search all enabled sources in parallel
  const searches: Promise<ImageSearchResult[]>[] = [];

  if (unsplashKey && (config?.unsplash?.enabled !== false)) {
    searches.push(searchUnsplash(keywords, unsplashKey));
  }
  if (pexelsKey && (config?.pexels?.enabled !== false)) {
    searches.push(searchPexels(keywords, pexelsKey));
  }
  if (pixabayKey && (config?.pixabay?.enabled !== false)) {
    searches.push(searchPixabay(keywords, pixabayKey));
  }

  if (searches.length > 0) {
    const allResults = await Promise.all(searches);
    for (const sourceResults of allResults) {
      results.push(...sourceResults);
    }
  }

  if (results.length > 0) {
    // Pick a random result from the top results for variety
    const topResults = results.slice(0, Math.min(5, results.length));
    const selected = topResults[Math.floor(Math.random() * topResults.length)];
    console.log(`[ImageSearch] Selected image from ${selected.source}: ${selected.url.slice(0, 60)}...`);
    return selected;
  }

  console.log('[ImageSearch] No results found, using fallback');
  return null;
}

// Get image source configuration from database settings
export async function getImageSourceConfig(brandId: string): Promise<ImageSourceConfig | null> {
  try {
    const { getCollection } = await import('@/lib/db/mongodb');
    const collection = await getCollection(brandId, 'settings');
    const setting = await collection.findOne({ key: 'imageSources' });
    
    if (setting?.value) {
      return setting.value as ImageSourceConfig;
    }
    return null;
  } catch (error) {
    console.error('Error loading image source config:', error);
    return null;
  }
}

// Fallback images when no API is configured
export function getFallbackImage(category: string, title: string): string {
  const categoryKeywords: Record<string, string[]> = {
    news: ['news', 'newspaper', 'journalism', 'media', 'press'],
    technology: ['technology', 'computer', 'digital', 'innovation', 'tech'],
    health: ['health', 'medical', 'wellness', 'fitness', 'healthcare'],
    finance: ['finance', 'business', 'money', 'economy', 'stock'],
    sports: ['sports', 'athletics', 'game', 'competition', 'fitness'],
    lifestyle: ['lifestyle', 'living', 'home', 'fashion', 'travel'],
    entertainment: ['entertainment', 'movie', 'music', 'concert', 'show'],
  };

  const keywords = categoryKeywords[category.toLowerCase()] || categoryKeywords.news;
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];
  
  // Use Unsplash Source (no API key needed) with random sig
  const sig = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  return `https://source.unsplash.com/800x450/?${keyword}&sig=${sig}`;
}
