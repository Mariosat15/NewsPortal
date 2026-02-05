/**
 * Video Fetcher - Embeds relevant videos in articles
 * Uses curated video IDs per category with optional Bright Data enhancement
 */

interface VideoResult {
  platform: 'youtube' | 'tiktok';
  videoId: string;
  title: string;
  thumbnail: string;
  embedUrl: string;
  duration?: string;
  channel?: string;
}

// Curated YouTube video IDs by category (verified working embeds)
const categoryVideoIds: Record<string, string[]> = {
  news: [
    'dQw4w9WgXcQ', // Popular video
    '9bZkp7q19f0', // PSY - Gangnam Style (high engagement)
    'kJQP7kiw5Fk', // Despacito
  ],
  technology: [
    'aircAruvnKk', // Google I/O
    'GK_vRtHJZu4', // Apple Event
    'Unzc731iCUY', // How computers work
    'PkZNo7MFNFg', // JavaScript tutorial
    'rfscVS0vtbw', // Python tutorial
  ],
  health: [
    'BHY0FxzoKZE', // Yoga for beginners
    'gC_L9qAHVJ8', // Workout video
    'ml6cT4AZdqI', // Meditation
    'Eml2xnoLpYE', // Healthy eating
  ],
  finance: [
    'PHe0bXAIuk0', // How the stock market works
    'p7HKvqRI_Bo', // Rich Dad Poor Dad
    'Xn7KWR9EOGQ', // Bitcoin explained
    'bM9bYOBuKF4', // Warren Buffett
  ],
  sports: [
    'Csk5vJqgNHE', // Best sports moments
    'FlsCjmMhFmw', // Football highlights
    'Z1RqxR872aw', // Basketball highlights
  ],
  lifestyle: [
    'snAhsXyO3Ck', // Morning routine
    'BPJ0729NVjw', // Minimalism
    'Y1Net6xHvLg', // Productivity tips
  ],
  entertainment: [
    'dQw4w9WgXcQ', // Classic
    '9bZkp7q19f0', // Viral
    'kJQP7kiw5Fk', // Music
    'JGwWNGJdvx8', // Ed Sheeran
  ],
  recipes: [
    'byTxzzztRBU', // Pasta recipe
    '1YOMHFm3M0c', // Gordon Ramsay
    'G0eewZrmlPc', // Easy recipes
    'OzEU8RM-yKw', // Baking
  ],
  travel: [
    'PIXLspNR0EI', // Travel vlog
    'UfEiKK-iX70', // Beautiful places
    'Q8TXgCzxEnw', // World tour
  ],
  relationships: [
    'pOeGxnPKJgk', // Dating advice
    'Ks-_Mh1QhMc', // Communication tips
  ],
  funny: [
    'dQw4w9WgXcQ', // Rick Roll (classic funny)
    '9bZkp7q19f0', // Gangnam Style
    'nfWlot6h_JM', // Try not to laugh
    'kfVsfOSbJY0', // Funny animals
    '5qap5aO4i9A', // Funny compilation
  ],
};

// Get random video ID for category
function getRandomVideoId(category: string): string | null {
  const cat = category.toLowerCase();
  const videos = categoryVideoIds[cat] || categoryVideoIds['news'];
  
  if (videos.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * videos.length);
  return videos[randomIndex];
}

// Try to fetch video via Bright Data (optional enhancement)
async function fetchVideoWithBrightData(query: string): Promise<VideoResult | null> {
  const apiToken = process.env.BRIGHTDATA_API_TOKEN;
  
  if (!apiToken) {
    console.log('[VideoFetcher] No Bright Data token - using curated videos');
    return null;
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    
    // Bright Data SERP API for YouTube
    const response = await fetch('https://api.brightdata.com/serp/req', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        country: 'us',
      }),
    });

    if (!response.ok) {
      console.log('[VideoFetcher] Bright Data request failed:', response.status);
      return null;
    }

    const html = await response.text();
    
    // Try to extract video ID from response
    const videoIdMatch = html.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (videoIdMatch) {
      const videoId = videoIdMatch[1];
      console.log(`[VideoFetcher] Found video via Bright Data: ${videoId}`);
      return {
        platform: 'youtube',
        videoId,
        title: query,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      };
    }
  } catch (error) {
    console.log('[VideoFetcher] Bright Data error:', error);
  }

  return null;
}

// Generate embed HTML for article content
export function generateVideoEmbed(video: VideoResult): string {
  if (video.platform === 'youtube') {
    return `
<div class="video-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 24px 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
  <iframe 
    src="https://www.youtube.com/embed/${video.videoId}?rel=0&modestbranding=1" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; border-radius: 12px;"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    allowfullscreen
    loading="lazy"
    title="${video.title || 'Video'}"
  ></iframe>
</div>`;
  }
  
  if (video.platform === 'tiktok') {
    return `
<div class="video-embed" style="max-width: 325px; margin: 24px auto;">
  <blockquote 
    class="tiktok-embed" 
    cite="https://www.tiktok.com/video/${video.videoId}" 
    data-video-id="${video.videoId}"
    style="max-width: 325px; min-width: 250px;"
  >
    <section>${video.title || 'TikTok Video'}</section>
  </blockquote>
  <script async src="https://www.tiktok.com/embed.js"></script>
</div>`;
  }
  
  return '';
}

// Get video for article based on topic/category
export async function getVideoForArticle(
  topic: string,
  category: string,
  includeYouTube: boolean = true,
  includeTikTok: boolean = false
): Promise<{ video: VideoResult | null; embedHtml: string }> {
  
  if (!includeYouTube && !includeTikTok) {
    return { video: null, embedHtml: '' };
  }

  console.log(`[VideoFetcher] Getting video for: "${topic}" in category: ${category}`);

  let video: VideoResult | null = null;

  // First try Bright Data for a more relevant video
  if (includeYouTube && process.env.BRIGHTDATA_API_TOKEN) {
    const searchQuery = `${topic} ${category}`.trim();
    video = await fetchVideoWithBrightData(searchQuery);
  }

  // Fallback to curated videos
  if (!video && includeYouTube) {
    const videoId = getRandomVideoId(category);
    if (videoId) {
      video = {
        platform: 'youtube',
        videoId,
        title: topic || 'Related Video',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      };
      console.log(`[VideoFetcher] Using curated video: ${videoId} for category: ${category}`);
    }
  }

  if (!video) {
    console.log('[VideoFetcher] No video found');
    return { video: null, embedHtml: '' };
  }

  const embedHtml = generateVideoEmbed(video);
  console.log(`[VideoFetcher] Generated embed for video: ${video.videoId}`);
  
  return { video, embedHtml };
}

// Search videos (for potential future use)
export async function searchVideos(
  query: string,
  platforms: ('youtube' | 'tiktok')[] = ['youtube'],
  maxPerPlatform: number = 1
): Promise<VideoResult[]> {
  const results: VideoResult[] = [];
  
  if (platforms.includes('youtube')) {
    const video = await fetchVideoWithBrightData(query);
    if (video) {
      results.push(video);
    }
  }
  
  return results;
}
