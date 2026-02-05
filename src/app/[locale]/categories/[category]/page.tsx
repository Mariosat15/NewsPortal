import { getTranslations } from 'next-intl/server';
import { getArticleRepository } from '@/lib/db';
import { getBrandId, getServerBrandConfig } from '@/lib/brand/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock } from 'lucide-react';
import { getCollection } from '@/lib/db/mongodb';
import { getNewTemplateSettings, isNewTemplate } from '@/lib/settings/get-template';
import { getTemplateById } from '@/lib/templates';
import { resolveTemplate } from '@/lib/templates/server';

// Force dynamic to always load fresh categories
export const dynamic = 'force-dynamic';

// Default category metadata for fallback
const defaultCategoryMeta: Record<string, { 
  icon: string; 
  gradient: string;
  color: string;
  labelDe: string;
  labelEn: string;
  descDe: string;
  descEn: string;
}> = {
  news: { 
    icon: '📰', 
    gradient: 'from-slate-700 to-slate-900',
    color: '#475569',
    labelDe: 'Nachrichten',
    labelEn: 'News',
    descDe: 'Aktuelle Nachrichten aus Deutschland und der Welt',
    descEn: 'Current news from Germany and around the world'
  },
  technology: { 
    icon: '💻', 
    gradient: 'from-blue-600 to-indigo-700',
    color: '#2563eb',
    labelDe: 'Technologie',
    labelEn: 'Technology',
    descDe: 'Die neuesten Tech-Trends und Innovationen',
    descEn: 'The latest tech trends and innovations'
  },
  health: { 
    icon: '🏥', 
    gradient: 'from-emerald-600 to-teal-700',
    color: '#059669',
    labelDe: 'Gesundheit',
    labelEn: 'Health',
    descDe: 'Gesundheitstipps und medizinische Neuigkeiten',
    descEn: 'Health tips and medical news'
  },
  finance: { 
    icon: '💰', 
    gradient: 'from-amber-600 to-orange-700',
    color: '#d97706',
    labelDe: 'Finanzen',
    labelEn: 'Finance',
    descDe: 'Finanznachrichten und Anlagestrategien',
    descEn: 'Financial news and investment strategies'
  },
  business: { 
    icon: '💼', 
    gradient: 'from-amber-600 to-orange-700',
    color: '#d97706',
    labelDe: 'Wirtschaft',
    labelEn: 'Business',
    descDe: 'Wirtschaftsnachrichten und Markttrends',
    descEn: 'Business news and market trends'
  },
  sports: { 
    icon: '⚽', 
    gradient: 'from-red-600 to-rose-700',
    color: '#dc2626',
    labelDe: 'Sport',
    labelEn: 'Sports',
    descDe: 'Sportnachrichten und Spielberichte',
    descEn: 'Sports news and match reports'
  },
  lifestyle: { 
    icon: '✨', 
    gradient: 'from-purple-600 to-violet-700',
    color: '#9333ea',
    labelDe: 'Lifestyle',
    labelEn: 'Lifestyle',
    descDe: 'Lifestyle, Mode und Trends',
    descEn: 'Lifestyle, fashion and trends'
  },
  entertainment: { 
    icon: '🎬', 
    gradient: 'from-pink-600 to-fuchsia-700',
    color: '#db2777',
    labelDe: 'Unterhaltung',
    labelEn: 'Entertainment',
    descDe: 'Unterhaltung, Filme und Musik',
    descEn: 'Entertainment, movies and music'
  },
  recipes: { 
    icon: '🍳', 
    gradient: 'from-orange-500 to-red-600',
    color: '#f97316',
    labelDe: 'Rezepte',
    labelEn: 'Recipes',
    descDe: 'Köstliche Rezepte und Kochtipps',
    descEn: 'Delicious recipes and cooking tips'
  },
  relationships: { 
    icon: '💕', 
    gradient: 'from-rose-500 to-pink-600',
    color: '#f43f5e',
    labelDe: 'Beziehungen',
    labelEn: 'Relationships',
    descDe: 'Tipps für Beziehungen und Dating',
    descEn: 'Tips for relationships and dating'
  },
  travel: { 
    icon: '✈️', 
    gradient: 'from-cyan-500 to-blue-600',
    color: '#06b6d4',
    labelDe: 'Reisen',
    labelEn: 'Travel',
    descDe: 'Reiseziele und Urlaubstipps',
    descEn: 'Travel destinations and vacation tips'
  },
  science: { 
    icon: '🔬', 
    gradient: 'from-indigo-500 to-purple-600',
    color: '#6366f1',
    labelDe: 'Wissenschaft',
    labelEn: 'Science',
    descDe: 'Wissenschaftliche Entdeckungen und Forschung',
    descEn: 'Scientific discoveries and research'
  },
  culture: { 
    icon: '🎭', 
    gradient: 'from-violet-500 to-purple-600',
    color: '#8b5cf6',
    labelDe: 'Kultur',
    labelEn: 'Culture',
    descDe: 'Kunst, Kultur und Events',
    descEn: 'Art, culture and events'
  },
  music: { 
    icon: '🎵', 
    gradient: 'from-fuchsia-500 to-pink-600',
    color: '#d946ef',
    labelDe: 'Musik',
    labelEn: 'Music',
    descDe: 'Musik-News und Künstler',
    descEn: 'Music news and artists'
  },
  world: { 
    icon: '🌍', 
    gradient: 'from-green-500 to-emerald-600',
    color: '#22c55e',
    labelDe: 'Welt',
    labelEn: 'World',
    descDe: 'Internationale Nachrichten',
    descEn: 'International news'
  },
  politics: { 
    icon: '🏛️', 
    gradient: 'from-gray-600 to-slate-700',
    color: '#4b5563',
    labelDe: 'Politik',
    labelEn: 'Politics',
    descDe: 'Politische Nachrichten und Analysen',
    descEn: 'Political news and analysis'
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

type CategoryFromDb = {
  slug: string;
  name?: string;
  displayName?: { de: string; en: string };
  icon?: string;
  color?: string;
  enabled?: boolean;
  aliases?: string[];
};

// Fetch all categories from database
async function getCategoriesFromDb(brandId: string): Promise<CategoryFromDb[]> {
  try {
    const settingsCollection = await getCollection(brandId, 'settings');
    const categoriesDoc = await settingsCollection.findOne({ key: 'categories' });
    if (categoriesDoc?.value && Array.isArray(categoriesDoc.value)) {
      return categoriesDoc.value;
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
  return [];
}

// Find category by slug or alias
function findCategoryBySlugOrAlias(categories: CategoryFromDb[], slug: string): CategoryFromDb | null {
  // Direct match
  const direct = categories.find(c => c.slug === slug);
  if (direct) return direct;
  
  // Check aliases
  for (const cat of categories) {
    if (cat.aliases && cat.aliases.includes(slug)) {
      return cat;
    }
  }
  
  return null;
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  const t = await getTranslations('categories');
  const brandId = await getBrandId();
  const brandConfig = await getServerBrandConfig();
  
  // Fetch categories from database
  const dbCategories = await getCategoriesFromDb(brandId);
  
  // Find category (supports aliases like finance -> business)
  const categoryConfig = findCategoryBySlugOrAlias(dbCategories, category);
  const actualCategorySlug = categoryConfig?.slug || category;
  
  // Get category metadata (from DB or defaults)
  const defaultMeta = defaultCategoryMeta[actualCategorySlug] || defaultCategoryMeta[category] || {
    icon: '📁',
    gradient: 'from-gray-600 to-gray-800',
    color: '#6b7280',
    labelDe: category.charAt(0).toUpperCase() + category.slice(1),
    labelEn: category.charAt(0).toUpperCase() + category.slice(1),
    descDe: `Artikel zum Thema ${category}`,
    descEn: `Articles about ${category}`
  };
  
  const meta = {
    icon: categoryConfig?.icon || defaultMeta.icon,
    gradient: defaultMeta.gradient,
    color: categoryConfig?.color || defaultMeta.color,
    labelDe: categoryConfig?.displayName?.de || categoryConfig?.name || defaultMeta.labelDe,
    labelEn: categoryConfig?.displayName?.en || categoryConfig?.name || defaultMeta.labelEn,
    descDe: defaultMeta.descDe,
    descEn: defaultMeta.descEn,
  };

  // Fetch template settings
  const templateSettings = await getNewTemplateSettings();
  const useNewTemplate = isNewTemplate(templateSettings.templateId);
  let resolvedTemplate = null;
  
  if (useNewTemplate) {
    const templateDef = getTemplateById(templateSettings.templateId);
    const colorMode = templateSettings.colorMode === 'dark' ? 'dark' : 'light';
    resolvedTemplate = resolveTemplate(templateSettings.templateId, colorMode);
  }

  let articles: ArticlePreview[] = [];
  try {
    const repo = getArticleRepository(brandId);
    
    // Search for articles with both the requested category and the actual category slug
    const categoriesToSearch = [category];
    if (actualCategorySlug !== category) {
      categoriesToSearch.push(actualCategorySlug);
    }
    // Also search aliases
    if (categoryConfig?.aliases) {
      categoriesToSearch.push(...categoryConfig.aliases);
    }
    
    // Fetch articles for all matching category slugs
    const allArticles: ArticlePreview[] = [];
    for (const cat of categoriesToSearch) {
      const result = await repo.listPublished({
        page: 1,
        limit: 50,
        category: cat,
      });
      
      for (const a of result.articles) {
        // Avoid duplicates
        if (!allArticles.find(existing => existing.slug === a.slug)) {
          allArticles.push({
            slug: a.slug,
            title: a.title,
            teaser: a.teaser,
            thumbnail: a.thumbnail,
            category: a.category,
            publishDate: a.publishDate.toISOString(),
            language: a.language,
          });
        }
      }
    }
    
    // Sort by publish date
    articles = allArticles.sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
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
  
  // Get accent color from template or default
  const accentColor = resolvedTemplate?.activeColors?.accent || meta.color || '#e91e8c';

  // Use template colors if available
  const colors = resolvedTemplate?.activeColors || {
    background: '#f8f9fa',
    surface: '#ffffff',
    surfaceAlt: '#f1f5f9',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    accent: accentColor,
    primary: accentColor,
  };
  
  const typography = resolvedTemplate?.typography || {
    headingFont: 'system-ui, sans-serif',
    bodyFont: 'system-ui, sans-serif',
    headingWeight: 700,
  };
  
  const spacing = resolvedTemplate?.spacing || {
    containerMax: '1280px',
    cardGap: '1.5rem',
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: colors.background }}
    >
      {/* Category Header */}
      <div 
        className="relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}dd 100%)`,
        }}
      >
        <div 
          className="mx-auto px-4 py-12 md:py-16"
          style={{ maxWidth: spacing.containerMax }}
        >
          <div className="flex items-center gap-4 mb-3">
            <span className="text-5xl">{meta.icon}</span>
            <div>
              <h1 
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-white"
                style={{ fontFamily: typography.headingFont }}
              >
                {locale === 'de' ? meta.labelDe : meta.labelEn}
              </h1>
            </div>
          </div>
          <p className="text-white/80 max-w-xl text-lg mt-4">
            {locale === 'de' ? meta.descDe : meta.descEn}
          </p>
          <p className="text-white/60 text-sm mt-4 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-white/60"></span>
            {articles.length} {locale === 'de' ? 'Artikel' : 'articles'}
          </p>
        </div>
        {/* Decorative pattern */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
          <div className="absolute inset-0 bg-white" style={{ 
            clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)' 
          }} />
        </div>
      </div>

      <div 
        className="mx-auto px-4 py-10"
        style={{ maxWidth: spacing.containerMax }}
      >
        {articles.length > 0 ? (
          <>
            {/* Featured Article */}
            {featuredArticle && (
              <Link
                href={`/${locale}/article/${featuredArticle.slug}`}
                className="group block mb-10"
              >
                <div 
                  className="relative overflow-hidden shadow-xl"
                  style={{ borderRadius: '1rem' }}
                >
                  <div className="aspect-[21/9] md:aspect-[21/8]">
                    <Image
                      src={featuredArticle.thumbnail}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="100vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                      <span 
                        className="inline-block text-white text-xs font-bold uppercase px-3 py-1.5 rounded-full mb-4"
                        style={{ backgroundColor: meta.color }}
                      >
                        {locale === 'de' ? meta.labelDe : meta.labelEn}
                      </span>
                      <h2 
                        className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight"
                        style={{ fontFamily: typography.headingFont }}
                      >
                        {featuredArticle.title}
                      </h2>
                      <p className="text-white/70 line-clamp-2 max-w-3xl hidden md:block text-lg">
                        {featuredArticle.teaser}
                      </p>
                      <div className="flex items-center gap-4 text-white/50 text-sm mt-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(featuredArticle.publishDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Articles Grid */}
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              style={{ gap: spacing.cardGap }}
            >
              {gridArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/${locale}/article/${article.slug}`}
                  className="group overflow-hidden transition-all hover:shadow-xl"
                  style={{ 
                    backgroundColor: colors.surface,
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={article.thumbnail}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div 
                      className="absolute top-3 left-3 px-2 py-1 text-xs font-bold uppercase text-white rounded"
                      style={{ backgroundColor: meta.color }}
                    >
                      {locale === 'de' ? meta.labelDe : meta.labelEn}
                    </div>
                  </div>
                  <div className="p-5">
                    <p 
                      className="text-xs mb-2 flex items-center gap-2"
                      style={{ color: colors.textMuted }}
                    >
                      <Clock className="w-3 h-3" />
                      {formatDate(article.publishDate)}
                    </p>
                    <h3 
                      className="font-bold leading-snug line-clamp-2 mb-2 transition-colors"
                      style={{ 
                        color: colors.text,
                        fontFamily: typography.headingFont,
                      }}
                    >
                      {article.title}
                    </h3>
                    <p 
                      className="text-sm line-clamp-2"
                      style={{ color: colors.textMuted }}
                    >
                      {article.teaser}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div 
            className="text-center py-20 rounded-xl"
            style={{ backgroundColor: colors.surface }}
          >
            <span className="text-7xl block mb-6">{meta.icon}</span>
            <h2 
              className="text-2xl font-bold mb-3"
              style={{ color: colors.text, fontFamily: typography.headingFont }}
            >
              {locale === 'de' ? 'Noch keine Artikel' : 'No articles yet'}
            </h2>
            <p 
              className="mb-8 max-w-md mx-auto"
              style={{ color: colors.textMuted }}
            >
              {locale === 'de' 
                ? 'Artikel in dieser Kategorie werden bald verfügbar sein.'
                : 'Articles in this category will be available soon.'
              }
            </p>
            <Link 
              href={`/${locale}`}
              className="inline-flex items-center gap-2 font-medium px-6 py-3 rounded-full text-white transition-transform hover:scale-105"
              style={{ backgroundColor: meta.color }}
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
