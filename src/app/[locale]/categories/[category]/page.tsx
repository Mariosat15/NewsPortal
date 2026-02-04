import { getTranslations } from 'next-intl/server';
import { getArticleRepository } from '@/lib/db';
import { getBrandId } from '@/lib/brand/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

// Valid categories
const validCategories = ['news', 'technology', 'health', 'finance', 'sports', 'lifestyle', 'entertainment'];

// Category metadata
const categoryMeta: Record<string, { 
  icon: string; 
  gradient: string;
  labelDe: string;
  labelEn: string;
  descDe: string;
  descEn: string;
}> = {
  news: { 
    icon: '📰', 
    gradient: 'from-slate-700 to-slate-900',
    labelDe: 'Nachrichten',
    labelEn: 'News',
    descDe: 'Aktuelle Nachrichten aus Deutschland und der Welt',
    descEn: 'Current news from Germany and around the world'
  },
  technology: { 
    icon: '💻', 
    gradient: 'from-blue-600 to-indigo-700',
    labelDe: 'Technologie',
    labelEn: 'Technology',
    descDe: 'Die neuesten Tech-Trends und Innovationen',
    descEn: 'The latest tech trends and innovations'
  },
  health: { 
    icon: '🏥', 
    gradient: 'from-emerald-600 to-teal-700',
    labelDe: 'Gesundheit',
    labelEn: 'Health',
    descDe: 'Gesundheitstipps und medizinische Neuigkeiten',
    descEn: 'Health tips and medical news'
  },
  finance: { 
    icon: '💰', 
    gradient: 'from-amber-600 to-orange-700',
    labelDe: 'Finanzen',
    labelEn: 'Business',
    descDe: 'Finanznachrichten und Anlagestrategien',
    descEn: 'Financial news and investment strategies'
  },
  sports: { 
    icon: '⚽', 
    gradient: 'from-red-600 to-rose-700',
    labelDe: 'Sport',
    labelEn: 'Sports',
    descDe: 'Sportnachrichten und Spielberichte',
    descEn: 'Sports news and match reports'
  },
  lifestyle: { 
    icon: '✨', 
    gradient: 'from-purple-600 to-violet-700',
    labelDe: 'Lifestyle',
    labelEn: 'Lifestyle',
    descDe: 'Lifestyle, Mode und Trends',
    descEn: 'Lifestyle, fashion and trends'
  },
  entertainment: { 
    icon: '🎬', 
    gradient: 'from-pink-600 to-fuchsia-700',
    labelDe: 'Unterhaltung',
    labelEn: 'Entertainment',
    descDe: 'Unterhaltung, Filme und Musik',
    descEn: 'Entertainment, movies and music'
  },
};

type ArticlePreview = {
  slug: string;
  title: string;
  teaser: string;
  thumbnail: string;
  category: string;
  publishDate: string;
  language: 'de' | 'en';
};

export function generateStaticParams() {
  const locales = ['de', 'en'];
  const params = [];
  for (const locale of locales) {
    for (const category of validCategories) {
      params.push({ locale, category });
    }
  }
  return params;
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  const t = await getTranslations('categories');

  if (!validCategories.includes(category)) {
    notFound();
  }

  const meta = categoryMeta[category];

  let articles: ArticlePreview[] = [];
  try {
    const brandId = await getBrandId();
    const repo = getArticleRepository(brandId);
    const result = await repo.listPublished({
      page: 1,
      limit: 30,
      category,
    });
    articles = result.articles.map(a => ({
      slug: a.slug,
      title: a.title,
      teaser: a.teaser,
      thumbnail: a.thumbnail,
      category: a.category,
      publishDate: a.publishDate.toISOString(),
      language: a.language,
    }));
  } catch (error) {
    console.log('Error fetching category articles:', error);
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const featuredArticle = articles[0];
  const gridArticles = articles.slice(1);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Category Header */}
      <div className={`bg-gradient-to-r ${meta.gradient} text-white`}>
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-4xl">{meta.icon}</span>
            <h1 className="text-3xl md:text-4xl font-bold">
              {locale === 'de' ? meta.labelDe : meta.labelEn}
            </h1>
          </div>
          <p className="text-white/80 max-w-xl">
            {locale === 'de' ? meta.descDe : meta.descEn}
          </p>
          <p className="text-white/60 text-sm mt-3">
            {articles.length} {locale === 'de' ? 'Artikel' : 'articles'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {articles.length > 0 ? (
          <>
            {/* Featured Article */}
            {featuredArticle && (
              <Link
                href={`/${locale}/article/${featuredArticle.slug}`}
                className="group block mb-8"
              >
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <div className="aspect-[21/9]">
                    <Image
                      src={featuredArticle.thumbnail}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="100vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <span className="inline-block bg-[#e91e8c] text-white text-xs font-bold uppercase px-3 py-1 rounded mb-3">
                        {locale === 'de' ? meta.labelDe : meta.labelEn}
                      </span>
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-[#e91e8c] transition-colors">
                        {featuredArticle.title}
                      </h2>
                      <p className="text-white/70 line-clamp-2 max-w-2xl hidden md:block">
                        {featuredArticle.teaser}
                      </p>
                      <p className="text-white/50 text-sm mt-3">
                        {formatDate(featuredArticle.publishDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/${locale}/article/${article.slug}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={article.thumbnail}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-gray-400 mb-2">
                      {formatDate(article.publishDate)}
                    </p>
                    <h3 className="font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#e91e8c] transition-colors mb-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {article.teaser}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <span className="text-6xl block mb-4">{meta.icon}</span>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {locale === 'de' ? 'Noch keine Artikel' : 'No articles yet'}
            </h2>
            <p className="text-gray-500 mb-6">
              {locale === 'de' 
                ? 'Artikel in dieser Kategorie werden bald verfügbar sein.'
                : 'Articles in this category will be available soon.'
              }
            </p>
            <Link 
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-[#e91e8c] font-medium hover:underline"
            >
              {locale === 'de' ? 'Zur Startseite' : 'Go to Home'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
