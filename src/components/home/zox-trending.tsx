'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Article {
  slug: string;
  title: string;
  thumbnail: string;
  category: string;
  publishDate: string;
}

interface ZoxTrendingProps {
  articles: Article[];
  locale: string;
  title?: string;
}

const categoryLabels: Record<string, Record<string, string>> = {
  de: {
    technology: 'TECH',
    health: 'GESUNDHEIT',
    finance: 'BUSINESS',
    sports: 'SPORT',
    lifestyle: 'LIFESTYLE',
    news: 'NEWS',
    entertainment: 'UNTERHALTUNG',
  },
  en: {
    technology: 'TECH',
    health: 'HEALTH',
    finance: 'BUSINESS',
    sports: 'SPORTS',
    lifestyle: 'LIFESTYLE',
    news: 'NEWS',
    entertainment: 'ENTERTAINMENT',
  },
};

export function ZoxTrending({ articles, locale, title }: ZoxTrendingProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return locale === 'de' ? 'Heute' : 'Today';
    if (diffDays === 1) return locale === 'de' ? 'Gestern' : 'Yesterday';
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const labels = categoryLabels[locale] || categoryLabels['en'];

  if (articles.length === 0) return null;

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className="mb-5">
        <span className="inline-block bg-[#e91e8c] text-white text-[11px] font-bold uppercase px-3 py-1.5 rounded">
          {title || 'TRENDING'}
        </span>
      </div>

      {/* Trending Articles */}
      <div className="space-y-4">
        {articles.slice(0, 10).map((article, index) => (
          <Link
            key={article.slug}
            href={`/${locale}/article/${article.slug}`}
            className="group flex gap-4 items-start"
          >
            {/* Number */}
            <span className="text-3xl font-black text-gray-200 leading-none w-6 flex-shrink-0">
              {index + 1}
            </span>

            {/* Thumbnail */}
            <div className="relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden">
              <Image
                src={article.thumbnail}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="80px"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#e91e8c]">
                  {labels[article.category] || article.category.toUpperCase()}
                </span>
                <span className="text-[10px] text-gray-400">/</span>
                <span className="text-[10px] text-gray-400">
                  {formatDate(article.publishDate)}
                </span>
              </div>
              <h4 className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-[#e91e8c] transition-colors">
                {article.title}
              </h4>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
