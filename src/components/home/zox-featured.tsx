'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Article {
  slug: string;
  title: string;
  teaser: string;
  thumbnail: string;
  category: string;
  publishDate: string;
}

interface ZoxFeaturedProps {
  articles: Article[];
  locale: string;
}

const categoryLabels: Record<string, Record<string, string>> = {
  de: {
    technology: 'TECHNOLOGIE',
    health: 'GESUNDHEIT',
    finance: 'FINANZEN',
    sports: 'SPORT',
    lifestyle: 'LIFESTYLE',
    news: 'NACHRICHTEN',
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

export function ZoxFeatured({ articles, locale }: ZoxFeaturedProps) {
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

  const mainArticle = articles[0];
  const secondaryArticles = articles.slice(1, 3);

  return (
    <div className="space-y-4">
      {/* Main Featured Article */}
      <Link
        href={`/${locale}/article/${mainArticle.slug}`}
        className="group block relative overflow-hidden rounded-xl shadow-sm"
      >
        <div className="relative aspect-[16/10]">
          <Image
            src={mainArticle.thumbnail}
            alt={mainArticle.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold px-2.5 py-1 bg-[#e91e8c] text-white rounded">
                {labels[mainArticle.category] || mainArticle.category.toUpperCase()}
              </span>
              <span className="text-[11px] text-white/70">
                {formatDate(mainArticle.publishDate)}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-white leading-tight mb-2 group-hover:text-[#e91e8c] transition-colors">
              {mainArticle.title}
            </h2>

            <p className="text-white/70 text-sm line-clamp-2 max-w-lg hidden sm:block">
              {mainArticle.teaser}
            </p>
          </div>
        </div>
      </Link>

      {/* Secondary Articles */}
      <div className="grid grid-cols-2 gap-4">
        {secondaryArticles.map((article) => (
          <Link
            key={article.slug}
            href={`/${locale}/article/${article.slug}`}
            className="group block relative overflow-hidden rounded-xl shadow-sm"
          >
            <div className="relative aspect-[16/11]">
              <Image
                src={article.thumbnail}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#e91e8c] text-white rounded">
                    {labels[article.category] || article.category.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-white/70">
                    {formatDate(article.publishDate)}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-[#e91e8c] transition-colors">
                  {article.title}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
