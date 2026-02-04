'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Clock, ChevronRight, ChevronDown, Flame } from 'lucide-react';

interface Article {
  slug: string;
  title: string;
  teaser: string;
  thumbnail: string;
  category: string;
  publishDate: string;
}

interface DarkPortalTemplateProps {
  articles: Article[];
  locale: string;
  categoryLabels: Record<string, string>;
  primaryColor: string;
}

const categoryColors: Record<string, string> = {
  news: 'bg-slate-500',
  technology: 'bg-cyan-500',
  health: 'bg-emerald-500',
  finance: 'bg-amber-500',
  sports: 'bg-red-500',
  lifestyle: 'bg-purple-500',
  entertainment: 'bg-pink-500',
  world: 'bg-blue-500',
  politics: 'bg-red-600',
  business: 'bg-orange-500',
};

export function DarkPortalTemplate({ articles, locale, categoryLabels, primaryColor }: DarkPortalTemplateProps) {
  const [activeTab, setActiveTab] = useState<'latest' | 'popular' | 'trending'>('latest');
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return locale === 'de' ? 'Gerade eben' : 'Just now';
    if (diffHours < 24) return `${diffHours}h ${locale === 'de' ? 'her' : 'ago'}`;
    return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric' });
  };

  const featuredArticle = articles[0];
  const tabArticles = articles.slice(1, 5);
  const topStories = articles.slice(5, 10);
  const worldNews = articles.slice(0, 5);
  const politicsArticles = articles.filter(a => a.category === 'news').slice(0, 4);
  const businessArticles = articles.filter(a => a.category === 'finance').slice(0, 4);
  const techArticles = articles.filter(a => a.category === 'technology').slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Breaking News */}
      <div className="bg-red-600">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 py-2">
            <span className="bg-white text-red-600 text-[10px] font-black px-2 py-1 rounded animate-pulse">
              BREAKING NEWS
            </span>
            <p className="text-white text-sm truncate">
              {featuredArticle?.title || 'Latest breaking news updates'}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8">
            {/* Hero Featured */}
            {featuredArticle && (
              <Link
                href={`/${locale}/article/${featuredArticle.slug}`}
                className="group block relative rounded-xl overflow-hidden mb-8"
              >
                <div className="aspect-[21/10]">
                  <Image
                    src={featuredArticle.thumbnail}
                    alt={featuredArticle.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-white/60 text-sm">{formatDate(featuredArticle.publishDate)}</span>
                    <span className="text-white/60 text-sm">• 455 Comments</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-3 group-hover:text-red-400 transition-colors">
                    {featuredArticle.title}
                  </h1>
                  <p className="text-white/70 line-clamp-2 max-w-2xl">
                    {featuredArticle.teaser}
                  </p>
                </div>
              </Link>
            )}

            {/* Tabs Section */}
            <div className="mb-8">
              <div className="flex gap-1 border-b border-gray-200 mb-4">
                {[
                  { id: 'latest', label: locale === 'de' ? 'NEUESTE' : 'LATEST NEWS' },
                  { id: 'popular', label: locale === 'de' ? 'BELIEBT' : 'POPULAR' },
                  { id: 'trending', label: 'TRENDING' },
                  { id: 'articles', label: locale === 'de' ? 'ARTIKEL' : 'LATEST ARTICLES' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'latest' | 'popular' | 'trending')}
                    className={`px-4 py-2 text-sm font-bold transition-colors ${
                      activeTab === tab.id
                        ? 'text-red-600 border-b-2 border-red-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tabArticles.map((article) => (
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
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className={`absolute top-2 left-2 ${categoryColors[article.category] || 'bg-gray-500'} text-white text-[9px] font-bold px-2 py-0.5 rounded`}>
                        {categoryLabels[article.category] || article.category}
                      </span>
                      <span className="absolute top-2 right-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                        {formatDate(article.publishDate)}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
                      {article.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>

            {/* Top Stories */}
            <div className="bg-gray-900 rounded-xl p-6 mb-8">
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-500" />
                TOP STORIES
              </h2>
              <div className="grid grid-cols-12 gap-4">
                {/* Main Story */}
                {topStories[0] && (
                  <Link
                    href={`/${locale}/article/${topStories[0].slug}`}
                    className="col-span-12 md:col-span-5 group"
                  >
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-3">
                      <Image
                        src={topStories[0].thumbnail}
                        alt={topStories[0].title}
                        fill
                        className="object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                        {categoryLabels[topStories[0].category] || topStories[0].category}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold leading-snug group-hover:text-red-400 transition-colors">
                      {topStories[0].title}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">{formatDate(topStories[0].publishDate)}</p>
                  </Link>
                )}

                {/* Side Stories */}
                <div className="col-span-12 md:col-span-7 space-y-3">
                  {topStories.slice(1, 4).map((article) => (
                    <Link
                      key={article.slug}
                      href={`/${locale}/article/${article.slug}`}
                      className="group flex gap-3"
                    >
                      <div className="relative flex-shrink-0 w-24 h-16 rounded overflow-hidden">
                        <Image
                          src={article.thumbnail}
                          alt={article.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-amber-400 font-bold uppercase">
                          {categoryLabels[article.category] || article.category}
                        </span>
                        <h4 className="text-white text-sm font-medium leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">
                          {article.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Politics */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b-2 border-red-600">
                  POLITICS
                </h3>
                {politicsArticles[0] && (
                  <Link
                    href={`/${locale}/article/${politicsArticles[0].slug}`}
                    className="group block mb-4"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                      <Image
                        src={politicsArticles[0].thumbnail}
                        alt={politicsArticles[0].title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h4 className="font-semibold text-gray-900 leading-snug group-hover:text-red-600 transition-colors">
                      {politicsArticles[0].title}
                    </h4>
                    <p className="text-gray-500 text-xs mt-1">{formatDate(politicsArticles[0].publishDate)}</p>
                  </Link>
                )}
                <div className="space-y-2">
                  {politicsArticles.slice(1).map((article) => (
                    <Link
                      key={article.slug}
                      href={`/${locale}/article/${article.slug}`}
                      className="group flex items-center gap-2 text-sm"
                    >
                      <span className="text-red-500">›</span>
                      <span className="text-gray-700 group-hover:text-red-600 transition-colors line-clamp-1">
                        {article.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Business */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b-2 border-amber-500">
                  BUSINESS
                </h3>
                {businessArticles[0] && (
                  <Link
                    href={`/${locale}/article/${businessArticles[0].slug}`}
                    className="group block mb-4"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                      <Image
                        src={businessArticles[0].thumbnail}
                        alt={businessArticles[0].title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h4 className="font-semibold text-gray-900 leading-snug group-hover:text-red-600 transition-colors">
                      {businessArticles[0].title}
                    </h4>
                    <p className="text-gray-500 text-xs mt-1">{formatDate(businessArticles[0].publishDate)}</p>
                  </Link>
                )}
                <div className="space-y-2">
                  {businessArticles.slice(1).map((article) => (
                    <Link
                      key={article.slug}
                      href={`/${locale}/article/${article.slug}`}
                      className="group flex items-center gap-2 text-sm"
                    >
                      <span className="text-amber-500">›</span>
                      <span className="text-gray-700 group-hover:text-red-600 transition-colors line-clamp-1">
                        {article.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            {/* World News */}
            <div className="bg-gray-900 rounded-xl p-5">
              <h3 className="text-white font-bold mb-4">WORLD</h3>
              <div className="space-y-3">
                {worldNews.slice(0, 5).map((article) => (
                  <Link
                    key={article.slug}
                    href={`/${locale}/article/${article.slug}`}
                    className="group flex items-start gap-2"
                  >
                    <span className="text-red-500 text-sm mt-0.5">›</span>
                    <span className="text-gray-300 text-sm leading-snug group-hover:text-white transition-colors">
                      {article.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Technology */}
            <div className="bg-gray-100 rounded-xl p-5">
              <h3 className="text-gray-900 font-bold mb-4">TECHNOLOGY</h3>
              {techArticles[0] && (
                <Link
                  href={`/${locale}/article/${techArticles[0].slug}`}
                  className="group block mb-4"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                    <Image
                      src={techArticles[0].thumbnail}
                      alt={techArticles[0].title}
                      fill
                      className="object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-cyan-500 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                      {categoryLabels[techArticles[0].category] || 'Tech'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-red-600 transition-colors">
                    {techArticles[0].title}
                  </h4>
                </Link>
              )}
              <div className="space-y-3">
                {techArticles.slice(1).map((article) => (
                  <Link
                    key={article.slug}
                    href={`/${locale}/article/${article.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                      <Image
                        src={article.thumbnail}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h5 className="text-sm text-gray-700 group-hover:text-red-600 transition-colors">
                      {article.title}
                    </h5>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
