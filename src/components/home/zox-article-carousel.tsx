'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface Article {
  slug: string;
  title: string;
  thumbnail: string;
  category: string;
  publishDate: string;
  hasVideo?: boolean;
}

interface ZoxArticleCarouselProps {
  articles: Article[];
  locale: string;
  title?: string;
  showBadge?: boolean;
}

export function ZoxArticleCarousel({ articles, locale, title, showBadge = true }: ZoxArticleCarouselProps) {
  if (articles.length === 0) return null;

  return (
    <div className="w-full">
      {/* Section Header */}
      {title && showBadge && (
        <div className="mb-4">
          <span className="inline-block bg-[#e91e8c] text-white text-[11px] font-bold uppercase px-2.5 py-1 tracking-wide">
            {title}
          </span>
        </div>
      )}

      {/* Horizontal Scroll Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/${locale}/article/${article.slug}`}
            className="group flex-shrink-0 w-[200px]"
          >
            {/* Thumbnail */}
            <div className="relative aspect-[16/10] mb-2 overflow-hidden">
              <Image
                src={article.thumbnail}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="200px"
              />
              {article.hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#00d4aa] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Title */}
            <h4 className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#e91e8c] transition-colors">
              {article.title}
            </h4>
          </Link>
        ))}
      </div>
    </div>
  );
}
