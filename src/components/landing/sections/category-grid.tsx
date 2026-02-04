'use client';

import Image from 'next/image';
import { trackLinkClick, navigateToPortal } from '@/lib/tracking/tracker';

interface Article {
  slug: string;
  title: string;
  teaser: string;
  thumbnail: string;
  category: string;
}

interface CategoryGridProps {
  title?: string;
  articles: Article[];
  columns?: 2 | 3 | 4;
  showCategory?: boolean;
  locale: string;
}

const columnClasses = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

export function CategoryGrid({
  title,
  articles,
  columns = 3,
  showCategory = true,
  locale,
}: CategoryGridProps) {
  const handleArticleClick = (article: Article) => {
    const url = `/${locale}/article/${article.slug}`;
    trackLinkClick(url, article.slug, article.title);
    navigateToPortal(url);
  };

  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 md:px-6">
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
          {title}
        </h2>
      )}
      
      <div className={`grid ${columnClasses[columns]} gap-6 max-w-7xl mx-auto`}>
        {articles.map((article) => (
          <article
            key={article.slug}
            onClick={() => handleArticleClick(article)}
            className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={article.thumbnail}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {showCategory && (
                <span className="absolute top-3 left-3 px-3 py-1 bg-pink-600 text-white text-xs font-bold uppercase rounded">
                  {article.category}
                </span>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-2 group-hover:text-pink-600 transition-colors">
                {article.title}
              </h3>
              <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                {article.teaser}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
