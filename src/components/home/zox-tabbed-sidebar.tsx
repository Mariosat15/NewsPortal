'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Article {
  slug: string;
  title: string;
  thumbnail: string;
  category: string;
  publishDate: string;
}

interface ZoxTabbedSidebarProps {
  latestArticles: Article[];
  popularArticles: Article[];
  locale: string;
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

export function ZoxTabbedSidebar({ latestArticles, popularArticles, locale }: ZoxTabbedSidebarProps) {
  const [activeTab, setActiveTab] = useState<'latest' | 'popular'>('latest');

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

  const articles = activeTab === 'latest' ? latestArticles : popularArticles;
  const labels = categoryLabels[locale] || categoryLabels['en'];

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-1 mb-5">
        <button
          onClick={() => setActiveTab('latest')}
          className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wide rounded transition-colors ${
            activeTab === 'latest'
              ? 'text-white bg-[#e91e8c]'
              : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {locale === 'de' ? 'NEUESTE' : 'LATEST'}
        </button>
        <button
          onClick={() => setActiveTab('popular')}
          className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wide rounded transition-colors ${
            activeTab === 'popular'
              ? 'text-white bg-[#e91e8c]'
              : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {locale === 'de' ? 'BELIEBT' : 'POPULAR'}
        </button>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        {articles.slice(0, 5).map((article) => (
          <Link
            key={article.slug}
            href={`/${locale}/article/${article.slug}`}
            className="group flex gap-3"
          >
            {/* Thumbnail */}
            <div className="relative flex-shrink-0 w-16 h-14 rounded-lg overflow-hidden">
              <Image
                src={article.thumbnail}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="64px"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[9px] font-bold uppercase text-[#e91e8c]">
                  {labels[article.category] || article.category.toUpperCase()}
                </span>
                <span className="text-[9px] text-gray-400">/</span>
                <span className="text-[9px] text-gray-400">
                  {formatDate(article.publishDate)}
                </span>
              </div>
              <h4 className="text-[12px] font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-[#e91e8c] transition-colors">
                {article.title}
              </h4>
            </div>
          </Link>
        ))}
      </div>

      {/* View More */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <Link 
          href={`/${locale}/trending`}
          className="text-[11px] font-bold text-[#e91e8c] uppercase tracking-wide hover:underline"
        >
          {locale === 'de' ? 'MEHR ANZEIGEN' : 'VIEW MORE'} →
        </Link>
      </div>
    </div>
  );
}
