'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface Article {
  slug: string;
  title: string;
  teaser: string;
  thumbnail: string;
  category: string;
  publishDate: string;
}

interface ZoxCategorySectionProps {
  category: string;
  categoryLabel: string;
  articles: Article[];
  locale: string;
  layout?: 'featured-left' | 'grid';
}

export function ZoxCategorySection({ 
  category, 
  categoryLabel, 
  articles, 
  locale,
  layout = 'featured-left'
}: ZoxCategorySectionProps) {
  if (articles.length < 2) return null;

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

  const mainArticle = articles[0];
  const sideArticles = articles.slice(1, 5);

  if (layout === 'featured-left') {
    return (
      <section className="mb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="inline-block bg-[#e91e8c] text-white text-[11px] font-bold uppercase px-3 py-1.5 rounded">
            {categoryLabel}
          </span>
          <Link 
            href={`/${locale}/categories/${category}`}
            className="text-[12px] text-gray-500 hover:text-[#e91e8c] font-medium flex items-center gap-1 transition-colors"
          >
            {locale === 'de' ? 'Alle anzeigen' : 'View all'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Article */}
          <div className="lg:col-span-7">
            <Link
              href={`/${locale}/article/${mainArticle.slug}`}
              className="group block relative overflow-hidden rounded-xl"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={mainArticle.thumbnail}
                  alt={mainArticle.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#e91e8c] text-white rounded">
                      {categoryLabel.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-white/70">
                      {formatDate(mainArticle.publishDate)}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white leading-tight mb-2 group-hover:text-[#e91e8c] transition-colors">
                    {mainArticle.title}
                  </h3>
                  <p className="text-white/60 text-sm line-clamp-2 hidden md:block">
                    {mainArticle.teaser}
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Side Articles */}
          <div className="lg:col-span-5 space-y-4">
            {sideArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/${locale}/article/${article.slug}`}
                className="group flex gap-4"
              >
                <div className="relative flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden">
                  <Image
                    src={article.thumbnail}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="96px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[9px] font-bold text-[#e91e8c] uppercase">
                      {categoryLabel}
                    </span>
                    <span className="text-[9px] text-gray-400">/</span>
                    <span className="text-[9px] text-gray-400">
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
      </section>
    );
  }

  // Grid layout
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <span className="inline-block bg-[#e91e8c] text-white text-[11px] font-bold uppercase px-3 py-1.5 rounded">
          {categoryLabel}
        </span>
        <Link 
          href={`/${locale}/categories/${category}`}
          className="text-[12px] text-gray-500 hover:text-[#e91e8c] font-medium flex items-center gap-1 transition-colors"
        >
          {locale === 'de' ? 'Alle anzeigen' : 'View all'}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {articles.slice(0, 4).map((article) => (
          <Link
            key={article.slug}
            href={`/${locale}/article/${article.slug}`}
            className="group"
          >
            <div className="relative aspect-[16/10] mb-3 rounded-lg overflow-hidden">
              <Image
                src={article.thumbnail}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <h4 className="text-[13px] font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-[#e91e8c] transition-colors">
              {article.title}
            </h4>
            <p className="text-[11px] text-gray-400 mt-1">
              {formatDate(article.publishDate)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
