'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock } from 'lucide-react';

interface Article {
  slug: string;
  title: string;
  teaser: string;
  thumbnail: string;
  category: string;
  publishDate: string;
}

interface CategorySectionProps {
  category: string;
  categoryLabel: string;
  articles: Article[];
  locale: string;
  showTeaser?: boolean;
}

const categoryGradients: Record<string, string> = {
  news: 'from-slate-600 to-slate-800',
  technology: 'from-blue-500 to-indigo-600',
  health: 'from-emerald-500 to-teal-600',
  finance: 'from-amber-500 to-orange-600',
  sports: 'from-red-500 to-rose-600',
  lifestyle: 'from-purple-500 to-violet-600',
  entertainment: 'from-pink-500 to-fuchsia-600',
};

const categoryIcons: Record<string, string> = {
  news: '📰',
  technology: '💻',
  health: '🏥',
  finance: '💰',
  sports: '⚽',
  lifestyle: '✨',
  entertainment: '🎬',
};

export function CategorySection({ 
  category, 
  categoryLabel, 
  articles, 
  locale,
  showTeaser = false 
}: CategorySectionProps) {
  if (articles.length === 0) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // First article is featured (larger), rest are in grid
  const [featured, ...rest] = articles;

  return (
    <section className="py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${categoryGradients[category] || 'from-gray-600 to-gray-800'} text-white font-bold text-lg flex items-center gap-2`}>
            <span>{categoryIcons[category]}</span>
            {categoryLabel}
          </span>
        </h2>
        <Link 
          href={`/${locale}/categories/${category}`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
        >
          {locale === 'de' ? 'Alle anzeigen' : 'View all'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Featured Article (Large) */}
        <div className="lg:col-span-6">
          <Link
            href={`/${locale}/article/${featured.slug}`}
            className="group block h-full"
          >
            <div className="relative h-full min-h-[300px] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <Image
                src={featured.thumbnail}
                alt={featured.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 bg-gradient-to-r ${categoryGradients[category]} text-white`}>
                  {categoryIcons[category]} {categoryLabel}
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-200 transition-colors">
                  {featured.title}
                </h3>
                {showTeaser && (
                  <p className="text-white/80 text-sm line-clamp-2 mb-3 hidden sm:block">
                    {featured.teaser}
                  </p>
                )}
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Clock className="h-4 w-4" />
                  {formatDate(featured.publishDate)}
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Smaller Articles Grid */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rest.slice(0, 4).map((article) => (
            <Link
              key={article.slug}
              href={`/${locale}/article/${article.slug}`}
              className="group"
            >
              <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={article.thumbnail}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors text-sm leading-snug flex-1">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-2 text-gray-500 text-xs mt-2">
                    <Clock className="h-3 w-3" />
                    {formatDate(article.publishDate)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
