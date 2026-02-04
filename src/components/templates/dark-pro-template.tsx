'use client';

import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Clock, MessageCircle, ChevronRight } from 'lucide-react';

interface Article {
  slug: string;
  title: string;
  teaser: string;
  thumbnail: string;
  category: string;
  publishDate: string;
}

interface DarkProTemplateProps {
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
  politics: 'bg-indigo-500',
  business: 'bg-orange-500',
};

export function DarkProTemplate({ articles, locale, categoryLabels, primaryColor }: DarkProTemplateProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return locale === 'de' ? 'Gerade eben' : 'Just now';
    if (diffHours < 24) return `${diffHours}h ${locale === 'de' ? 'her' : 'ago'}`;
    return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric' });
  };

  const featuredArticle = articles[0];
  const sidebarArticle = articles[1];
  const latestArticles = articles.slice(2, 6);
  const topStories = articles.slice(6, 10);
  const politicsArticles = articles.filter(a => a.category === 'news' || a.category === 'politics').slice(0, 3);
  const businessArticles = articles.filter(a => a.category === 'finance' || a.category === 'business').slice(0, 3);
  const techArticles = articles.filter(a => a.category === 'technology').slice(0, 3);
  const entertainmentArticle = articles.filter(a => a.category === 'entertainment')[0];

  return (
    <div className="min-h-screen bg-[#1a1d29]">
      {/* Breaking News Bar */}
      <div className="bg-red-600 text-white py-2">
        <div className="container mx-auto px-4 flex items-center gap-3">
          <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded">BREAKING NEWS</span>
          <p className="text-sm truncate">
            {featuredArticle?.teaser || 'Latest updates from around the world'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content - Left 8 columns */}
          <div className="col-span-12 lg:col-span-8">
            {/* Hero Section */}
            <div className="grid grid-cols-12 gap-4 mb-8">
              {/* Main Featured */}
              {featuredArticle && (
                <Link
                  href={`/${locale}/article/${featuredArticle.slug}`}
                  className="col-span-12 md:col-span-8 group"
                >
                  <div className="relative aspect-[16/10] rounded-lg overflow-hidden">
                    <Image
                      src={featuredArticle.thumbnail}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2 group-hover:text-[#f75454] transition-colors">
                        {featuredArticle.title}
                      </h1>
                      <p className="text-white/70 text-sm line-clamp-2">
                        {featuredArticle.teaser}
                      </p>
                    </div>
                  </div>
                </Link>
              )}

              {/* Side Featured */}
              {sidebarArticle && (
                <div className="col-span-12 md:col-span-4 space-y-4">
                  <Link
                    href={`/${locale}/article/${sidebarArticle.slug}`}
                    className="group block bg-[#242836] rounded-lg overflow-hidden"
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={sidebarArticle.thumbnail}
                        alt={sidebarArticle.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold leading-snug group-hover:text-[#f75454] transition-colors">
                        {sidebarArticle.title}
                      </h3>
                      <p className="text-gray-400 text-xs mt-2">{formatDate(sidebarArticle.publishDate)}</p>
                    </div>
                  </Link>

                  {/* Market Ticker (mock) */}
                  <div className="bg-[#242836] rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">Market:</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">DPXO</span>
                        <span className="text-white font-medium block">NASDAQ</span>
                      </div>
                      <div>
                        <span className="text-gray-400">DOW</span>
                        <span className="text-green-400 font-medium block">+153.34</span>
                      </div>
                      <div>
                        <span className="text-gray-400">S&P 500</span>
                        <span className="text-green-400 font-medium block">+19.20</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Latest News Row */}
            <div className="mb-8">
              <h2 className="text-white font-bold text-lg mb-4">Latest News</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {latestArticles.map((article) => (
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
                      <span className={`absolute top-2 left-2 ${categoryColors[article.category] || 'bg-gray-500'} text-white text-[10px] font-bold px-2 py-0.5 rounded`}>
                        {categoryLabels[article.category] || article.category}
                      </span>
                    </div>
                    <h3 className="text-white text-sm font-medium leading-snug line-clamp-2 group-hover:text-[#f75454] transition-colors">
                      {article.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>

            {/* Category Sections */}
            <div className="grid grid-cols-3 gap-6">
              {/* Politics */}
              <div>
                <h3 className="text-white font-bold mb-4 pb-2 border-b border-gray-700">Politics</h3>
                {politicsArticles.map((article, i) => (
                  <Link
                    key={article.slug}
                    href={`/${locale}/article/${article.slug}`}
                    className="group block mb-4"
                  >
                    {i === 0 && (
                      <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                        <Image src={article.thumbnail} alt={article.title} fill className="object-cover" />
                      </div>
                    )}
                    <h4 className="text-white text-sm font-medium leading-snug group-hover:text-[#f75454] transition-colors">
                      {article.title}
                    </h4>
                    <p className="text-gray-500 text-xs mt-1">{formatDate(article.publishDate)}</p>
                  </Link>
                ))}
              </div>

              {/* Business */}
              <div>
                <h3 className="text-white font-bold mb-4 pb-2 border-b border-gray-700">Business</h3>
                {businessArticles.map((article, i) => (
                  <Link
                    key={article.slug}
                    href={`/${locale}/article/${article.slug}`}
                    className="group block mb-4"
                  >
                    {i === 0 && (
                      <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                        <Image src={article.thumbnail} alt={article.title} fill className="object-cover" />
                      </div>
                    )}
                    <h4 className="text-white text-sm font-medium leading-snug group-hover:text-[#f75454] transition-colors">
                      {article.title}
                    </h4>
                    <p className="text-gray-500 text-xs mt-1">{formatDate(article.publishDate)}</p>
                  </Link>
                ))}
              </div>

              {/* Technology */}
              <div>
                <h3 className="text-white font-bold mb-4 pb-2 border-b border-gray-700">Technology</h3>
                {techArticles.map((article, i) => (
                  <Link
                    key={article.slug}
                    href={`/${locale}/article/${article.slug}`}
                    className="group block mb-4"
                  >
                    {i === 0 && (
                      <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                        <Image src={article.thumbnail} alt={article.title} fill className="object-cover" />
                      </div>
                    )}
                    <h4 className="text-white text-sm font-medium leading-snug group-hover:text-[#f75454] transition-colors">
                      {article.title}
                    </h4>
                    <p className="text-gray-500 text-xs mt-1">{formatDate(article.publishDate)}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Right 4 columns */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            {/* Top Stories */}
            <div className="bg-[#242836] rounded-lg p-5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-500" />
                Top Stories
              </h3>
              <div className="space-y-3">
                {topStories.map((article, i) => (
                  <Link
                    key={article.slug}
                    href={`/${locale}/article/${article.slug}`}
                    className="group flex items-start gap-3"
                  >
                    <span className="text-red-500 text-sm">●</span>
                    <p className="text-gray-300 text-sm leading-snug group-hover:text-white transition-colors">
                      {article.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-[#242836] rounded-lg p-5">
              <h3 className="text-white font-bold mb-2">Newsletter</h3>
              <p className="text-gray-400 text-sm mb-4">Get the latest news delivered daily!</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Search main round"
                  className="flex-1 bg-[#1a1d29] text-white text-sm px-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors">
                  Subscribe
                </button>
              </div>
            </div>

            {/* Entertainment */}
            {entertainmentArticle && (
              <div className="bg-[#242836] rounded-lg p-5">
                <h3 className="text-white font-bold mb-4">Entertainment</h3>
                <Link
                  href={`/${locale}/article/${entertainmentArticle.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                    <Image
                      src={entertainmentArticle.thumbnail}
                      alt={entertainmentArticle.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h4 className="text-white font-medium leading-snug group-hover:text-[#f75454] transition-colors">
                    {entertainmentArticle.title}
                  </h4>
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
