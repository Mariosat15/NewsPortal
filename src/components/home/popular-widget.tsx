'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Star, MessageCircle, Share2, Facebook, Twitter } from 'lucide-react';

interface Article {
  slug: string;
  title: string;
  thumbnail: string;
  category: string;
  publishDate: string;
  viewCount?: number;
}

interface PopularWidgetProps {
  articles: Article[];
  locale: string;
  showSocial?: boolean;
  showNewsletter?: boolean;
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

export function PopularWidget({ 
  articles, 
  locale, 
  showSocial = true,
  showNewsletter = true
}: PopularWidgetProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Social Connect */}
      {showSocial && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              {locale === 'de' ? 'Folge uns' : 'Follow Us'}
            </h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2">
            <a 
              href="#" 
              className="flex items-center justify-center gap-2 p-3 bg-[#1877F2] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Facebook className="h-5 w-5" />
              <span className="text-sm font-medium">Facebook</span>
            </a>
            <a 
              href="#" 
              className="flex items-center justify-center gap-2 p-3 bg-black text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Twitter className="h-5 w-5" />
              <span className="text-sm font-medium">X</span>
            </a>
          </div>
        </div>
      )}

      {/* Popular/Recent Articles */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Star className="h-5 w-5" />
            {locale === 'de' ? 'Beliebt' : 'Popular'}
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {articles.slice(0, 4).map((article) => (
            <Link
              key={article.slug}
              href={`/${locale}/article/${article.slug}`}
              className="group flex gap-3 p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden relative">
                <Image
                  src={article.thumbnail}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="80px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${categoryColors[article.category] || 'bg-gray-500'}`}>
                  {article.category.toUpperCase()}
                </span>
                <h4 className="font-medium text-xs text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors mt-1 leading-snug">
                  {article.title}
                </h4>
                <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDate(article.publishDate)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      {showNewsletter && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-6 w-6" />
            <h3 className="font-bold text-lg">Newsletter</h3>
          </div>
          <p className="text-white/80 text-sm mb-4">
            {locale === 'de' 
              ? 'Erhalten Sie die neuesten Nachrichten direkt in Ihr Postfach.'
              : 'Get the latest news delivered to your inbox.'}
          </p>
          <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder={locale === 'de' ? 'Ihre E-Mail' : 'Your email'}
              className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              className="w-full px-4 py-2.5 rounded-lg bg-white text-blue-600 font-semibold text-sm hover:bg-white/90 transition-colors"
            >
              {locale === 'de' ? 'Abonnieren' : 'Subscribe'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
