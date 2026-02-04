import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ArticleCard } from '@/components/article/article-card';
import { getArticleRepository } from '@/lib/db';
import { getServerBrandConfig, getBrandId } from '@/lib/brand';

// Article type for the page
type ArticlePreview = {
  slug: string;
  title: string;
  teaser: string;
  thumbnail: string;
  category: string;
  publishDate: string;
  language: 'de' | 'en';
};

// Sample data for demo (will be replaced by actual API call)
const sampleArticles: ArticlePreview[] = [
  {
    slug: 'example-article-1',
    title: 'Die neuesten Entwicklungen in der Technologiebranche',
    teaser: 'Erfahren Sie mehr über die bahnbrechenden Innovationen, die unsere digitale Zukunft prägen werden. Von künstlicher Intelligenz bis hin zu Quantencomputing.',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop',
    category: 'technology',
    publishDate: new Date().toISOString(),
    language: 'de',
  },
  {
    slug: 'example-article-2',
    title: 'Gesund leben: Die besten Tipps für 2026',
    teaser: 'Entdecken Sie die neuesten wissenschaftlichen Erkenntnisse zu Ernährung, Bewegung und mentalem Wohlbefinden.',
    thumbnail: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&h=450&fit=crop',
    category: 'health',
    publishDate: new Date(Date.now() - 86400000).toISOString(),
    language: 'de',
  },
  {
    slug: 'example-article-3',
    title: 'Finanzielle Freiheit: So erreichen Sie Ihre Ziele',
    teaser: 'Praktische Strategien und Tipps von Experten, um Ihre finanzielle Zukunft zu sichern.',
    thumbnail: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=450&fit=crop',
    category: 'finance',
    publishDate: new Date(Date.now() - 172800000).toISOString(),
    language: 'de',
  },
  {
    slug: 'example-article-4',
    title: 'Sport-Highlights: Die besten Momente der Woche',
    teaser: 'Von Bundesliga bis Champions League - alle wichtigen Sportereignisse im Überblick.',
    thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=450&fit=crop',
    category: 'sports',
    publishDate: new Date(Date.now() - 259200000).toISOString(),
    language: 'de',
  },
  {
    slug: 'example-article-5',
    title: 'Lifestyle Trends: Was jetzt angesagt ist',
    teaser: 'Mode, Design und Lifestyle - die aktuellen Trends, die Sie kennen sollten.',
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=450&fit=crop',
    category: 'lifestyle',
    publishDate: new Date(Date.now() - 345600000).toISOString(),
    language: 'de',
  },
  {
    slug: 'example-article-6',
    title: 'Nachrichten aus aller Welt',
    teaser: 'Die wichtigsten internationalen Ereignisse kompakt zusammengefasst.',
    thumbnail: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=450&fit=crop',
    category: 'news',
    publishDate: new Date(Date.now() - 432000000).toISOString(),
    language: 'de',
  },
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('article');
  const brand = await getServerBrandConfig();

  // Try to fetch real articles, fallback to sample data
  let articles = sampleArticles;
  try {
    const brandId = await getBrandId();
    const repo = getArticleRepository(brandId);
    const result = await repo.listPublished({
      page: 1,
      limit: 12,
      language: locale as 'de' | 'en',
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
      }));
    }
  } catch (error) {
    console.log('Using sample articles for demo');
  }

  const featuredArticle = articles[0];
  const trendingArticles = articles.slice(1, 4);
  const latestArticles = articles.slice(4);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container px-4 py-6 space-y-8">
          {/* Featured article */}
          {featuredArticle && (
            <section>
              <ArticleCard article={featuredArticle} variant="featured" />
            </section>
          )}

          {/* Trending articles */}
          {brand.features.trending && trendingArticles.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4">{t('trending')}</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {trendingArticles.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            </section>
          )}

          {/* Latest articles */}
          {latestArticles.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4">{t('latestNews')}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {latestArticles.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
