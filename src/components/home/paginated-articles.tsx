'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

const categoryColors: Record<string, string> = {
  news: 'bg-slate-600',
  technology: 'bg-blue-600',
  health: 'bg-emerald-600',
  finance: 'bg-amber-600',
  sports: 'bg-red-600',
  lifestyle: 'bg-purple-600',
  entertainment: 'bg-pink-600',
  recipes: 'bg-orange-500',
  relationships: 'bg-rose-500',
  travel: 'bg-cyan-600',
  science: 'bg-indigo-600',
  culture: 'bg-violet-600',
  music: 'bg-fuchsia-600',
};

interface PaginatedArticlesProps {
  articles: ArticlePreview[];
  locale: string;
  categoryLabels: Record<string, string>;
  articlesPerPage?: number;
  primaryColor?: string;
}

export function PaginatedArticles({
  articles,
  locale,
  categoryLabels,
  articlesPerPage = 4,
  primaryColor = '#e91e63',
}: PaginatedArticlesProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(articles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const currentArticles = articles.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of the articles section
      document.getElementById('latest-articles')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div id="latest-articles">
      {/* Articles List */}
      <div className="space-y-5">
        {currentArticles.map((article) => (
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
                  {categoryLabels[article.category]}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-8">
          {/* Previous Button */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
              currentPage === 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Page Numbers */}
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && goToPage(page)}
              disabled={page === '...'}
              className={`flex items-center justify-center min-w-[40px] h-10 px-3 rounded-lg font-medium text-sm transition-colors ${
                page === currentPage
                  ? 'text-white'
                  : page === '...'
                  ? 'text-gray-400 cursor-default'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={page === currentPage ? { backgroundColor: primaryColor } : {}}
            >
              {page}
            </button>
          ))}

          {/* Next Button */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
              currentPage === totalPages
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Page Info */}
      {totalPages > 1 && (
        <p className="text-center text-sm text-gray-500 mt-3">
          {locale === 'de' 
            ? `Seite ${currentPage} von ${totalPages} (${articles.length} Artikel)`
            : `Page ${currentPage} of ${totalPages} (${articles.length} articles)`
          }
        </p>
      )}
    </div>
  );
}
