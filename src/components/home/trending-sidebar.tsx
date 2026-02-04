'use client';

import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Clock, Eye } from 'lucide-react';

interface Article {
  slug: string;
  title: string;
  thumbnail: string;
  category: string;
  publishDate: string;
  viewCount?: number;
}

interface TrendingSidebarProps {
  articles: Article[];
  locale: string;
  title?: string;
  maxItems?: number;
}

const categoryColors: Record<string, string> = {
  news: 'text-slate-600',
  technology: 'text-blue-600',
  health: 'text-emerald-600',
  finance: 'text-amber-600',
  sports: 'text-red-600',
  lifestyle: 'text-purple-600',
  entertainment: 'text-pink-600',
};

export function TrendingSidebar({ 
  articles, 
  locale, 
  title,
  maxItems = 5 
}: TrendingSidebarProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return locale === 'de' ? 'Gerade eben' : 'Just now';
    if (diffHours < 24) return locale === 'de' ? `vor ${diffHours}h` : `${diffHours}h ago`;
    if (diffDays < 7) return locale === 'de' ? `vor ${diffDays}d` : `${diffDays}d ago`;
    
    return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const displayArticles = articles.slice(0, maxItems);

  if (displayArticles.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-3">
        <h3 className="text-white font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title || (locale === 'de' ? 'Trending' : 'Trending')}
        </h3>
      </div>

      {/* Articles List */}
      <div className="divide-y divide-gray-100">
        {displayArticles.map((article, index) => (
          <Link
            key={article.slug}
            href={`/${locale}/article/${article.slug}`}
            className="group flex gap-3 p-4 hover:bg-gray-50 transition-colors"
          >
            {/* Rank Number */}
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-white font-bold text-lg flex items-center justify-center shadow-md">
              {index + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <span className={`text-[10px] font-bold uppercase tracking-wide ${categoryColors[article.category] || 'text-gray-600'}`}>
                {article.category}
              </span>
              <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors mt-0.5 leading-snug">
                {article.title}
              </h4>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(article.publishDate)}
                </span>
                {article.viewCount !== undefined && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {article.viewCount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail */}
            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden relative">
              <Image
                src={article.thumbnail}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
                sizes="64px"
              />
            </div>
          </Link>
        ))}
      </div>

      {/* View All Link */}
      <div className="px-4 py-3 bg-gray-50 border-t">
        <Link 
          href={`/${locale}/trending`}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
        >
          {locale === 'de' ? 'Alle ansehen' : 'View all'}
          <span className="text-lg">→</span>
        </Link>
      </div>
    </div>
  );
}
