'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Clock, Eye, ArrowRight } from 'lucide-react';
import { formatDate, truncate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: {
    slug: string;
    title: string;
    teaser: string;
    thumbnail: string;
    category: string;
    publishDate: Date | string;
    language: 'de' | 'en';
    viewCount?: number;
  };
  variant?: 'default' | 'compact' | 'featured' | 'horizontal';
}

// Category color mapping
const categoryColors: Record<string, string> = {
  technology: 'bg-blue-100 text-blue-700 border-blue-200',
  health: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  finance: 'bg-amber-100 text-amber-700 border-amber-200',
  sports: 'bg-red-100 text-red-700 border-red-200',
  lifestyle: 'bg-purple-100 text-purple-700 border-purple-200',
  news: 'bg-slate-100 text-slate-700 border-slate-200',
  entertainment: 'bg-pink-100 text-pink-700 border-pink-200',
};

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const locale = useLocale();
  const t = useTranslations();

  const categoryColorClass = categoryColors[article.category] || categoryColors.news;

  // Compact variant - horizontal small card
  if (variant === 'compact') {
    return (
      <Link href={`/${locale}/article/${article.slug}`} className="group block">
        <div className="flex gap-4 p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={article.thumbnail}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="80px"
            />
          </div>
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border w-fit mb-1', categoryColorClass)}>
              {t(`categories.${article.category}`)}
            </span>
            <h3 className="font-semibold text-sm line-clamp-2 text-slate-900 group-hover:text-blue-600 transition-colors">
              {article.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(article.publishDate, locale)}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  // Featured variant - large hero card
  if (variant === 'featured') {
    return (
      <Link href={`/${locale}/article/${article.slug}`} className="group block">
        <div className="relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
          <div className="relative aspect-[21/9] w-full">
            <Image
              src={article.thumbnail}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, 80vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10">
            <span className={cn(
              'inline-block text-sm font-semibold px-3 py-1 rounded-full mb-4',
              'bg-white/20 backdrop-blur-sm text-white border border-white/30'
            )}>
              {t(`categories.${article.category}`)}
            </span>
            <h2 className="font-bold text-2xl md:text-3xl lg:text-4xl text-white line-clamp-2 mb-3 group-hover:text-blue-200 transition-colors">
              {article.title}
            </h2>
            <p className="text-base text-white/80 line-clamp-2 max-w-2xl hidden sm:block mb-4">
              {truncate(article.teaser, 180)}
            </p>
            <div className="flex items-center gap-4 text-sm text-white/70">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDate(article.publishDate, locale)}
              </span>
              {article.viewCount && (
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {article.viewCount.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Horizontal variant - medium horizontal card
  if (variant === 'horizontal') {
    return (
      <Link href={`/${locale}/article/${article.slug}`} className="group block">
        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-300">
          <div className="relative w-full sm:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={article.thumbnail}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, 192px"
            />
          </div>
          <div className="flex flex-col justify-between flex-1 min-w-0">
            <div>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border inline-block mb-2', categoryColorClass)}>
                {t(`categories.${article.category}`)}
              </span>
              <h3 className="font-bold text-lg line-clamp-2 text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                {article.title}
              </h3>
              <p className="text-sm text-slate-600 line-clamp-2">
                {truncate(article.teaser, 120)}
              </p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(article.publishDate, locale)}
              </span>
              <span className="text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                {t('article.readMore')}
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant - vertical card
  return (
    <Link href={`/${locale}/article/${article.slug}`} className="group block h-full">
      <div className="h-full flex flex-col rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 overflow-hidden">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={article.thumbnail}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute top-3 left-3">
            <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-sm', categoryColorClass)}>
              {t(`categories.${article.category}`)}
            </span>
          </div>
        </div>
        <div className="flex-1 flex flex-col p-4">
          <h3 className="font-bold text-lg line-clamp-2 text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
            {article.title}
          </h3>
          <p className="text-sm text-slate-600 line-clamp-2 flex-1 mb-3">
            {truncate(article.teaser, 100)}
          </p>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(article.publishDate, locale)}
            </span>
            <span className="text-blue-600 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 group-hover:gap-2 transition-all">
              {t('article.readMore')}
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
