import { getTranslations } from 'next-intl/server';
import { ZoxTrending, ZoxFeatured, ZoxTabbedSidebar, ZoxCategorySection } from '@/components/home';
import { DarkProTemplate, DarkPortalTemplate } from '@/components/templates';
import { getArticleRepository } from '@/lib/db';
import { getBrandId } from '@/lib/brand/server';
import { getTemplateSettings, colorSchemes } from '@/lib/settings/get-template';
import { ArrowRight, Flame, Clock, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

const categoryLabels: Record<string, Record<string, string>> = {
  de: {
    technology: 'Technologie',
    health: 'Gesundheit',
    finance: 'Finanzen',
    sports: 'Sport',
    lifestyle: 'Lifestyle',
    news: 'Nachrichten',
    entertainment: 'Unterhaltung',
    world: 'Welt',
    politics: 'Politik',
    business: 'Wirtschaft',
  },
  en: {
    technology: 'Tech',
    health: 'Health',
    finance: 'Business',
    sports: 'Sports',
    lifestyle: 'Lifestyle',
    news: 'News',
    entertainment: 'Entertainment',
    world: 'World',
    politics: 'Politics',
    business: 'Business',
  },
};

const categoryColors: Record<string, string> = {
  news: 'bg-slate-600',
  technology: 'bg-blue-600',
  health: 'bg-emerald-600',
  finance: 'bg-amber-600',
  sports: 'bg-red-600',
  lifestyle: 'bg-purple-600',
  entertainment: 'bg-pink-600',
};

function groupByCategory(articles: ArticlePreview[]): Record<string, ArticlePreview[]> {
  return articles.reduce((acc, article) => {
    const cat = article.category || 'news';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(article);
    return acc;
  }, {} as Record<string, ArticlePreview[]>);
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('article');

  // Fetch template settings
  const templateSettings = await getTemplateSettings();
  const colors = colorSchemes[templateSettings.colorScheme] || colorSchemes.pink;

  let articles: ArticlePreview[] = [];
  
  try {
    const brandId = await getBrandId();
    const repo = getArticleRepository(brandId);
    
    const result = await repo.listPublished({
      page: 1,
      limit: 50,
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
        viewCount: a.viewCount,
      }));
    }
  } catch (error) {
    console.error('[Homepage] Error fetching articles:', error);
  }

  const currentLabels = categoryLabels[locale] || categoryLabels['de'];
  const hasArticles = articles.length > 0;

  // Render based on template selection
  if (templateSettings.layout === 'dark-pro') {
    return (
      <DarkProTemplate
        articles={articles}
        locale={locale}
        categoryLabels={currentLabels}
        primaryColor={colors.primary}
      />
    );
  }

  if (templateSettings.layout === 'dark-portal') {
    return (
      <DarkPortalTemplate
        articles={articles}
        locale={locale}
        categoryLabels={currentLabels}
        primaryColor={colors.primary}
      />
    );
  }

  if (templateSettings.layout === 'minimal') {
    return (
      <MinimalTemplate
        articles={articles}
        locale={locale}
        categoryLabels={currentLabels}
        primaryColor={colors.primary}
        t={t}
      />
    );
  }

  if (templateSettings.layout === 'grid') {
    return (
      <GridTemplate
        articles={articles}
        locale={locale}
        categoryLabels={currentLabels}
        primaryColor={colors.primary}
        t={t}
      />
    );
  }

  if (templateSettings.layout === 'classic') {
    return (
      <ClassicTemplate
        articles={articles}
        locale={locale}
        categoryLabels={currentLabels}
        primaryColor={colors.primary}
        t={t}
      />
    );
  }

  // Default: Magazine template
  const trendingArticles = articles.slice(0, 6);
  const featuredArticles = articles.slice(0, 4);
  // Latest Articles - show all articles except the main featured one (for a full list)
  const latestArticles = articles.slice(1); // Skip only the main hero article
  const popularArticles = [...articles].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 8);
  
  const articlesByCategory = groupByCategory(articles);
  const categories = ['entertainment', 'sports', 'technology', 'health', 'finance', 'lifestyle'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section with Gradient */}
      {hasArticles && featuredArticles[0] && (
        <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
          <div className="absolute inset-0 opacity-30">
            <Image
              src={featuredArticles[0].thumbnail}
              alt=""
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="relative container mx-auto px-4 py-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Main Featured */}
              <Link
                href={`/${locale}/article/${featuredArticles[0].slug}`}
                className="group block"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <div className="aspect-[16/10]">
                    <Image
                      src={featuredArticles[0].thumbnail}
                      alt={featuredArticles[0].title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className={`inline-block ${categoryColors[featuredArticles[0].category] || 'bg-gray-600'} text-white text-xs font-bold uppercase px-3 py-1 rounded mb-3`}>
                      {currentLabels[featuredArticles[0].category]}
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-3 group-hover:text-[${colors.primary}] transition-colors">
                      {featuredArticles[0].title}
                    </h1>
                    <p className="text-white/70 line-clamp-2 hidden md:block">
                      {featuredArticles[0].teaser}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Side Featured */}
              <div className="space-y-4">
                {featuredArticles.slice(1, 4).map((article) => (
                  <Link
                    key={article.slug}
                    href={`/${locale}/article/${article.slug}`}
                    className="group flex gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition-colors"
                  >
                    <div className="relative flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden">
                      <Image
                        src={article.thumbnail}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase" style={{ color: colors.primary }}>
                        {currentLabels[article.category]}
                      </span>
                      <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 group-hover:opacity-80 transition-colors mt-1">
                        {article.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {!hasArticles && (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-10">
              <div className="text-6xl mb-6">📰</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {locale === 'de' ? 'Keine Artikel verfügbar' : 'No Articles Available'}
              </h2>
              <p className="text-gray-500 mb-6">
                {locale === 'de' 
                  ? 'Es wurden noch keine Artikel veröffentlicht.'
                  : 'No articles have been published yet.'}
              </p>
              <Link 
                href="/admin"
                className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors font-medium"
                style={{ backgroundColor: colors.primary }}
              >
                Admin Panel
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {hasArticles && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Sidebar - Trending */}
            <aside className="lg:col-span-3 order-2 lg:order-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <Flame className="h-5 w-5" style={{ color: colors.primary }} />
                  <span className="font-bold text-gray-900">
                    {locale === 'de' ? 'Trending' : 'Trending'}
                  </span>
                </div>
                <ZoxTrending 
                  articles={trendingArticles}
                  locale={locale}
                  title=""
                />
              </div>
            </aside>

            {/* Center - Latest Articles */}
            <main className="lg:col-span-6 order-1 lg:order-2">
              <div className="flex items-center gap-2 mb-5">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-bold text-gray-900">
                  {locale === 'de' ? 'Neueste Artikel' : 'Latest Articles'}
                </span>
              </div>
              
              <div className="space-y-5">
                {latestArticles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/${locale}/article/${article.slug}`}
                    className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative sm:w-48 h-40 sm:h-auto flex-shrink-0">
                        <Image
                          src={article.thumbnail}
                          alt={article.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-5 flex-1">
                        <span className={`inline-block ${categoryColors[article.category] || 'bg-gray-600'} text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded mb-2`}>
                          {currentLabels[article.category]}
                        </span>
                        <h3 className="font-bold text-gray-900 leading-snug line-clamp-2 group-hover:opacity-80 transition-colors mb-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-2">
                          {article.teaser}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </main>

            {/* Right Sidebar */}
            <aside className="lg:col-span-3 order-3">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <Star className="h-5 w-5 text-amber-500" />
                  <span className="font-bold text-gray-900">
                    {locale === 'de' ? 'Beliebt' : 'Popular'}
                  </span>
                </div>
                <ZoxTabbedSidebar 
                  latestArticles={latestArticles}
                  popularArticles={popularArticles}
                  locale={locale}
                />
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Category Sections */}
      {hasArticles && (
        <div className="bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 py-12">
            {categories.map((category, index) => {
              const categoryArticles = articlesByCategory[category];
              if (!categoryArticles || categoryArticles.length < 2) return null;
              
              return (
                <ZoxCategorySection
                  key={category}
                  category={category}
                  categoryLabel={currentLabels[category] || category}
                  articles={categoryArticles}
                  locale={locale}
                  layout={index % 2 === 0 ? 'featured-left' : 'grid'}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Minimal Template Component
function MinimalTemplate({ articles, locale, categoryLabels, primaryColor, t }: {
  articles: ArticlePreview[];
  locale: string;
  categoryLabels: Record<string, string>;
  primaryColor: string;
  t: ReturnType<typeof getTranslations> extends Promise<infer T> ? T : never;
}) {
  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1, 10);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {featuredArticle && (
          <Link
            href={`/${locale}/article/${featuredArticle.slug}`}
            className="group block mb-12"
          >
            <div className="text-center mb-6">
              <span className="text-sm font-medium uppercase tracking-wide" style={{ color: primaryColor }}>
                {categoryLabels[featuredArticle.category]}
              </span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mt-3 leading-tight group-hover:opacity-80 transition-colors">
                {featuredArticle.title}
              </h1>
              <p className="text-xl text-gray-600 mt-4">
                {featuredArticle.teaser}
              </p>
            </div>
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
              <Image
                src={featuredArticle.thumbnail}
                alt={featuredArticle.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </Link>
        )}

        <div className="space-y-8">
          {otherArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/${locale}/article/${article.slug}`}
              className="group block py-6 border-b border-gray-100"
            >
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: primaryColor }}>
                {categoryLabels[article.category]}
              </span>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mt-2 group-hover:opacity-80 transition-colors">
                {article.title}
              </h2>
              <p className="text-gray-600 mt-2 line-clamp-2">
                {article.teaser}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Grid Template Component
function GridTemplate({ articles, locale, categoryLabels, primaryColor, t }: {
  articles: ArticlePreview[];
  locale: string;
  categoryLabels: Record<string, string>;
  primaryColor: string;
  t: ReturnType<typeof getTranslations> extends Promise<infer T> ? T : never;
}) {
  const categories = ['all', 'news', 'technology', 'sports', 'entertainment'];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                i === 0 ? 'text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              style={i === 0 ? { backgroundColor: primaryColor } : {}}
            >
              {cat === 'all' ? (locale === 'de' ? 'Alle' : 'All') : categoryLabels[cat] || cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/${locale}/article/${article.slug}`}
              className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={article.thumbnail}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <span className="text-[10px] font-bold uppercase" style={{ color: primaryColor }}>
                  {categoryLabels[article.category]}
                </span>
                <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2 group-hover:opacity-80 transition-colors">
                  {article.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Classic Template Component
function ClassicTemplate({ articles, locale, categoryLabels, primaryColor, t }: {
  articles: ArticlePreview[];
  locale: string;
  categoryLabels: Record<string, string>;
  primaryColor: string;
  t: ReturnType<typeof getTranslations> extends Promise<infer T> ? T : never;
}) {
  const featuredArticle = articles[0];
  const sideArticles = articles.slice(1, 4);
  const moreArticles = articles.slice(4, 12);

  return (
    <div className="min-h-screen bg-white">
      {/* Breaking News Bar */}
      <div className="text-white py-3" style={{ backgroundColor: primaryColor }}>
        <div className="container mx-auto px-4 text-center font-bold">
          BREAKING NEWS: {featuredArticle?.teaser?.slice(0, 80)}...
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Story */}
          <div className="col-span-12 lg:col-span-8">
            {featuredArticle && (
              <Link
                href={`/${locale}/article/${featuredArticle.slug}`}
                className="group block"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                  <Image
                    src={featuredArticle.thumbnail}
                    alt={featuredArticle.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 group-hover:opacity-80 transition-colors">
                  {featuredArticle.title}
                </h1>
                <p className="text-gray-600 mt-3 text-lg">
                  {featuredArticle.teaser}
                </p>
              </Link>
            )}
          </div>

          {/* Side Stories */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {sideArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/${locale}/article/${article.slug}`}
                className="group block p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <span className="text-xs font-bold uppercase" style={{ color: primaryColor }}>
                  {categoryLabels[article.category]}
                </span>
                <h3 className="font-semibold text-gray-900 mt-1 group-hover:opacity-80 transition-colors">
                  {article.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>

        {/* More Articles */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {moreArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/${locale}/article/${article.slug}`}
              className="group"
            >
              <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                <Image
                  src={article.thumbnail}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:opacity-80 transition-colors">
                {article.title}
              </h4>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
