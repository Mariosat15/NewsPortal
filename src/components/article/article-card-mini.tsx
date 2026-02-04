'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';

interface ArticleCardMiniProps {
  article: {
    slug: string;
    title: string;
    thumbnail: string;
    category: string;
    publishDate: string;
    viewCount?: number;
  };
  locale: string;
  rank?: number;
  showCategory?: boolean;
  showDate?: boolean;
  showViews?: boolean;
}

const categoryColors: Record<string, string> = {
  news: 'bg-slate-500',
  technology: 'bg-blue-500',
  health: 'bg-emerald-500',
  finance: 'bg-amber-500',
  sports: 'bg-red-500',
  lifestyle: 'bg-purple-500',
  entertainment: 'bg-pink-500',
};

export function ArticleCardMini({ 
  article, 
  locale, 
  rank, 
  showCategory = true,
  showDate = true,
  showViews = false
}: ArticleCardMiniProps) {
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

  return (
    <Link 
      href={`/${locale}/article/${article.slug}`}
      className="group flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
    >
      {/* Rank Badge or Thumbnail */}
      <div className="relative flex-shrink-0">
        {rank !== undefined ? (
          <div className="relative">
            <div className="w-16 h-16 rounded-lg overflow-hidden">
              <Image
                src={article.thumbnail}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
                sizes="64px"
              />
            </div>
            <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
              {rank}
            </div>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg overflow-hidden relative">
            <Image
              src={article.thumbnail}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              sizes="64px"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {showCategory && (
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold text-white mb-1 ${categoryColors[article.category] || 'bg-gray-500'}`}>
            {article.category.toUpperCase()}
          </span>
        )}
        <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
          {article.title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          {showDate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(article.publishDate)}
            </span>
          )}
          {showViews && article.viewCount !== undefined && (
            <span>{article.viewCount.toLocaleString()} views</span>
          )}
        </div>
      </div>
    </Link>
  );
}
