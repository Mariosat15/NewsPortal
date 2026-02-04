import { AgentResult, EditedArticle, PublishedArticle } from './types';
import { getArticleRepository, ArticleCreateInput } from '@/lib/db';

const MIN_QUALITY_SCORE = 6; // Minimum quality score to publish

// Publish edited articles that meet quality threshold
export async function publishArticles(
  articles: EditedArticle[],
  brandId: string,
  minQualityScore: number = MIN_QUALITY_SCORE
): Promise<AgentResult<PublishedArticle[]>> {
  const startTime = Date.now();
  const publishedArticles: PublishedArticle[] = [];
  const repo = getArticleRepository(brandId);

  try {
    for (const article of articles) {
      try {
        // Check quality threshold
        if (article.qualityScore < minQualityScore) {
          console.log(`Skipping article "${article.title}" - quality score ${article.qualityScore} below threshold ${minQualityScore}`);
          continue;
        }

        // Create article input
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
          thumbnail: await generatePlaceholderThumbnail(article.category),
        };

        // Save to database
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

// Generate a placeholder thumbnail URL based on category
// In production, this could use an image generation API or stock photos
async function generatePlaceholderThumbnail(category: string): Promise<string> {
  // Unsplash category-based placeholder images
  const categoryImages: Record<string, string> = {
    news: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=450&fit=crop',
    lifestyle: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=450&fit=crop',
    technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop',
    sports: 'https://images.unsplash.com/photo-1461896836934-28e4e59a8a13?w=800&h=450&fit=crop',
    health: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&h=450&fit=crop',
    finance: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=450&fit=crop',
    entertainment: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop',
  };

  return categoryImages[category] || categoryImages.news;
}

// Check if article with similar title already exists
export async function isDuplicate(
  title: string,
  brandId: string
): Promise<boolean> {
  const repo = getArticleRepository(brandId);
  
  // Simple duplicate check based on slug
  // Could be enhanced with more sophisticated similarity matching
  const slug = title
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);

  const existing = await repo.findBySlug(slug);
  return existing !== null;
}

export { generatePlaceholderThumbnail };
