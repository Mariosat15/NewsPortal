/**
 * Video Fetcher - Uses Bright Data to search and fetch videos from YouTube/TikTok
 * This is a server-side only module
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

interface BrightDataResponse {
  html?: string;
  error?: string;
}

// Bright Data Web Unlocker fetch
async function fetchWithBrightData(url: string): Promise<string | null> {
  const apiToken = process.env.BRIGHTDATA_API_TOKEN;
  const zone = process.env.BRIGHTDATA_ZONE || 'web_unlocker1';
  
  if (!apiToken) {
    console.log('[VideoFetcher] No Bright Data API token configured');
    return null;
  }

  try {
    // Bright Data Web Unlocker endpoint
    const proxyUrl = `https://api.brightdata.com/request`;
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zone,
        url,
        format: 'raw',
      }),
    });

    if (!response.ok) {
      console.error('[VideoFetcher] Bright Data error:', response.status);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error('[VideoFetcher] Fetch error:', error);
    return null;
  }
}

// Search YouTube for videos
export async function searchYouTubeVideos(
  query: string,
  maxResults: number = 3
): Promise<VideoResult[]> {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  
  const html = await fetchWithBrightData(searchUrl);
  if (!html) return [];

  const videos: VideoResult[] = [];
  
  try {
    // Extract video data from YouTube's initial data JSON
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});<\/script>/);
    if (ytInitialDataMatch) {
      const data = JSON.parse(ytInitialDataMatch[1]);
      const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
      
      if (contents) {
        for (const section of contents) {
          const items = section?.itemSectionRenderer?.contents || [];
          for (const item of items) {
            if (item.videoRenderer && videos.length < maxResults) {
              const video = item.videoRenderer;
              videos.push({
                platform: 'youtube',
                videoId: video.videoId,
                title: video.title?.runs?.[0]?.text || 'Video',
                thumbnail: `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`,
                embedUrl: `https://www.youtube.com/embed/${video.videoId}`,
                duration: video.lengthText?.simpleText,
                channel: video.ownerText?.runs?.[0]?.text,
              });
            }
          }
        }
      }
    }
    
    // Fallback: regex extraction
    if (videos.length === 0) {
      const videoIdRegex = /watch\?v=([a-zA-Z0-9_-]{11})/g;
      const matches = html.matchAll(videoIdRegex);
      const seen = new Set<string>();
      
      for (const match of matches) {
        if (!seen.has(match[1]) && videos.length < maxResults) {
          seen.add(match[1]);
          videos.push({
            platform: 'youtube',
            videoId: match[1],
            title: 'YouTube Video',
            thumbnail: `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`,
            embedUrl: `https://www.youtube.com/embed/${match[1]}`,
          });
        }
      }
    }
  } catch (error) {
    console.error('[VideoFetcher] YouTube parse error:', error);
  }

  console.log(`[VideoFetcher] Found ${videos.length} YouTube videos for: ${query}`);
  return videos;
}

// Search TikTok for videos
export async function searchTikTokVideos(
  query: string,
  maxResults: number = 3
): Promise<VideoResult[]> {
  const searchUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`;
  
  const html = await fetchWithBrightData(searchUrl);
  if (!html) return [];

  const videos: VideoResult[] = [];
  
  try {
    // TikTok embeds video data in a script tag
    const dataMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>({.+?})<\/script>/);
    if (dataMatch) {
      const data = JSON.parse(dataMatch[1]);
      const searchData = data?.['__DEFAULT_SCOPE__']?.['webapp.search-detail'];
      const items = searchData?.itemList || [];
      
      for (const item of items) {
        if (videos.length >= maxResults) break;
        
        const videoId = item.id;
        const author = item.author?.uniqueId || 'user';
        
        videos.push({
          platform: 'tiktok',
          videoId: videoId,
          title: item.desc || 'TikTok Video',
          thumbnail: item.video?.cover || item.video?.dynamicCover || '',
          embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
          channel: `@${author}`,
        });
      }
    }
    
    // Fallback: regex for video IDs
    if (videos.length === 0) {
      const videoIdRegex = /video\/(\d{19})/g;
      const matches = html.matchAll(videoIdRegex);
      const seen = new Set<string>();
      
      for (const match of matches) {
        if (!seen.has(match[1]) && videos.length < maxResults) {
          seen.add(match[1]);
          videos.push({
            platform: 'tiktok',
            videoId: match[1],
            title: 'TikTok Video',
            thumbnail: '',
            embedUrl: `https://www.tiktok.com/embed/v2/${match[1]}`,
          });
        }
      }
    }
  } catch (error) {
    console.error('[VideoFetcher] TikTok parse error:', error);
  }

  console.log(`[VideoFetcher] Found ${videos.length} TikTok videos for: ${query}`);
  return videos;
}

// Search both platforms
export async function searchVideos(
  query: string,
  platforms: ('youtube' | 'tiktok')[] = ['youtube'],
  maxPerPlatform: number = 2
): Promise<VideoResult[]> {
  const results: VideoResult[] = [];
  
  if (platforms.includes('youtube')) {
    const ytVideos = await searchYouTubeVideos(query, maxPerPlatform);
    results.push(...ytVideos);
  }
  
  if (platforms.includes('tiktok')) {
    const ttVideos = await searchTikTokVideos(query, maxPerPlatform);
    results.push(...ttVideos);
  }
  
  return results;
}

// Generate embed HTML for article content
export function generateVideoEmbed(video: VideoResult): string {
  if (video.platform === 'youtube') {
    return `
<div class="video-embed video-youtube" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 24px 0; border-radius: 12px;">
  <iframe 
    src="${video.embedUrl}?rel=0" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; border-radius: 12px;"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen
    title="${video.title}"
  ></iframe>
</div>`;
  }
  
  if (video.platform === 'tiktok') {
    return `
<div class="video-embed video-tiktok" style="max-width: 325px; margin: 24px auto;">
  <blockquote 
    class="tiktok-embed" 
    cite="https://www.tiktok.com/video/${video.videoId}" 
    data-video-id="${video.videoId}"
    style="max-width: 325px; min-width: 250px;"
  >
    <section>${video.title}</section>
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
  const platforms: ('youtube' | 'tiktok')[] = [];
  if (includeYouTube) platforms.push('youtube');
  if (includeTikTok) platforms.push('tiktok');
  
  if (platforms.length === 0) {
    return { video: null, embedHtml: '' };
  }

  // Create search query from topic and category
  const searchQuery = `${topic} ${category}`.trim();
  
  const videos = await searchVideos(searchQuery, platforms, 1);
  
  if (videos.length === 0) {
    return { video: null, embedHtml: '' };
  }

  const video = videos[0];
  const embedHtml = generateVideoEmbed(video);
  
  return { video, embedHtml };
}
