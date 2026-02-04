import { AgentResult, EditedArticle, PublishedArticle } from './types';
import { getArticleRepository, ArticleCreateInput } from '@/lib/db';
import { searchImages, getImageSourceConfig, getFallbackImage } from '@/lib/services/image-search';

const MIN_QUALITY_SCORE = 6;

// Track used images to avoid repetition within a session
let usedImagesThisSession: Set<string> = new Set();

// Publish edited articles that meet quality threshold
export async function publishArticles(
  articles: EditedArticle[],
  brandId: string,
  minQualityScore: number = MIN_QUALITY_SCORE
): Promise<AgentResult<PublishedArticle[]>> {
  const startTime = Date.now();
  const publishedArticles: PublishedArticle[] = [];
  const repo = getArticleRepository(brandId);
  
  // Reset used images at start of batch
  usedImagesThisSession.clear();

  // Load image source configuration
  const imageConfig = await getImageSourceConfig(brandId);

  try {
    for (const article of articles) {
      try {
        if (article.qualityScore < minQualityScore) {
          console.log(`Skipping article "${article.title}" - quality score ${article.qualityScore} below threshold ${minQualityScore}`);
          continue;
        }

        // Search for a relevant image using AI-powered keyword generation
        const thumbnailUrl = await findBestImageForArticle(
          article.title,
          article.teaser,
          article.category,
          imageConfig
        );

        const articleInput: ArticleCreateInput = {
          title: article.title,
          teaser: article.teaser,
          content: article.content,
          category: article.category,
          tags: article.tags,
          status: 'published',
          publishDate: new Date(),
          agentGenerated: true,
          language: article.language,
          thumbnail: thumbnailUrl,
        };

        const savedArticle = await repo.create(articleInput);

        publishedArticles.push({
          ...article,
          publishedAt: new Date(),
          articleId: savedArticle._id!.toString(),
          slug: savedArticle.slug,
        });

        console.log(`Published article: "${article.title}" (${savedArticle.slug})`);
      } catch (error) {
        console.error(`Error publishing article "${article.title}":`, error);
      }
    }

    return {
      success: true,
      data: publishedArticles,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

// Find the best image for an article using AI-powered search
async function findBestImageForArticle(
  title: string,
  teaser: string,
  category: string,
  imageConfig: Awaited<ReturnType<typeof getImageSourceConfig>>
): Promise<string> {
  try {
    // Search for relevant images using the image search service
    const result = await searchImages(title, teaser, category, imageConfig || undefined);
    
    if (result && result.url) {
      // Track used image to avoid duplicates
      if (!usedImagesThisSession.has(result.url)) {
        usedImagesThisSession.add(result.url);
        return result.url;
      }
    }
  } catch (error) {
    console.error('Error searching for image:', error);
  }
  
  // Fallback to category-based image if no search results
  return getFallbackImage(category, title);
}

// Legacy function for backwards compatibility
export async function generatePlaceholderThumbnail(category: string): Promise<string> {
  return getFallbackImage(category, Date.now().toString());
}

export async function isDuplicate(title: string, brandId: string): Promise<boolean> {
  return false;
}
