import { getTranslations } from 'next-intl/server';
import { ArticleCard } from '@/components/article/article-card';
import { getArticleRepository } from '@/lib/db';
import { getBrandId } from '@/lib/brand/server';
import { TrendingUp, Flame } from 'lucide-react';

// Article type for the page
type ArticlePreview = {
  slug: string;
  title: string;
  teaser: string;
  thumbnail: string;
  category: string;
  publishDate: string;
  language: 'de' | 'en';
  viewCount?: number;
};

// Sample trending articles
const sampleTrendingDe: ArticlePreview[] = [
  {
    slug: 'trending-article-1',
    title: 'Die heißesten Tech-Trends des Jahres',
    teaser: 'Von KI bis Quantencomputing - diese Technologien werden die Zukunft prägen.',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop',
    category: 'technology',
    publishDate: new Date().toISOString(),
    language: 'de',
    viewCount: 15420,
  },
  {
    slug: 'trending-article-2',
    title: 'Bundesliga: Spannung pur im Titelkampf',
    teaser: 'Der Kampf um die Meisterschaft spitzt sich zu - alle Highlights im Überblick.',
    thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=450&fit=crop',
    category: 'sports',
    publishDate: new Date(Date.now() - 86400000).toISOString(),
    language: 'de',
    viewCount: 12350,
  },
  {
    slug: 'trending-article-3',
    title: 'Gesundheitstipps für den Winter',
    teaser: 'So stärken Sie Ihr Immunsystem und bleiben fit durch die kalte Jahreszeit.',
    thumbnail: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&h=450&fit=crop',
    category: 'health',
    publishDate: new Date(Date.now() - 172800000).toISOString(),
    language: 'de',
    viewCount: 9870,
  },
];

const sampleTrendingEn: ArticlePreview[] = [
  {
    slug: 'trending-article-1',
    title: 'The Hottest Tech Trends of the Year',
    teaser: 'From AI to quantum computing - these technologies will shape the future.',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop',
    category: 'technology',
    publishDate: new Date().toISOString(),
    language: 'en',
    viewCount: 15420,
  },
  {
    slug: 'trending-article-2',
    title: 'Champions League: Excitement in the Title Race',
    teaser: 'The fight for the championship is heating up - all highlights at a glance.',
    thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=450&fit=crop',
    category: 'sports',
    publishDate: new Date(Date.now() - 86400000).toISOString(),
    language: 'en',
    viewCount: 12350,
  },
  {
    slug: 'trending-article-3',
    title: 'Health Tips for Winter',
    teaser: 'How to strengthen your immune system and stay fit through the cold season.',
    thumbnail: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&h=450&fit=crop',
    category: 'health',
    publishDate: new Date(Date.now() - 172800000).toISOString(),
    language: 'en',
    viewCount: 9870,
  },
];

export default async function TrendingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('article');

  // Get sample articles based on locale
  const sampleArticles = locale === 'en' ? sampleTrendingEn : sampleTrendingDe;

  // Try to fetch real trending articles
  let articles = sampleArticles;
  try {
    const brandId = await getBrandId();
    const repo = getArticleRepository(brandId);
    const result = await repo.listPublished({
      page: 1,
      limit: 12,
      language: locale as 'de' | 'en',
      sortBy: 'viewCount',
    });
    if (result.articles.length > 0) {
      articles = result.articles.map(a => ({
        slug: a.slug,
        title: a.title,
        teaser: a.teaser,
        thumbnail: a.thumbnail,
        category: a.category,
        publishDate: a.publishDate.toISOString(),
        language: a.language,
        viewCount: a.viewCount || 0,
      }));
    }
  } catch (error) {
    console.log('Using sample trending articles for demo');
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl">
            <TrendingUp className="h-6 w-6 text-red-600" />
          </div>
          {t('trending')}
        </h1>
        <p className="text-slate-600 mt-2">
          {locale === 'de' 
            ? 'Die meistgelesenen Artikel der letzten Tage'
            : 'The most read articles of the last few days'
          }
        </p>
      </div>

      {/* Featured Trending */}
      {articles[0] && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-semibold text-slate-700">
              {locale === 'de' ? 'Top Artikel' : 'Top Article'}
            </span>
          </div>
          <ArticleCard article={articles[0]} variant="featured" />
        </section>
      )}

      {/* Trending Grid */}
      {articles.length > 1 && (
        <section>
          <h2 className="section-title mb-6">
            {locale === 'de' ? 'Weitere beliebte Artikel' : 'More Popular Articles'}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {articles.slice(1).map((article, index) => (
              <div key={article.slug} className="relative">
                <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                  {index + 2}
                </div>
                <ArticleCard article={article} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
