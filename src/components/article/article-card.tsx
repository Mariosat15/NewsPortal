'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, truncate } from '@/lib/utils';

interface ArticleCardProps {
  article: {
    slug: string;
    title: string;
    teaser: string;
    thumbnail: string;
    category: string;
    publishDate: Date | string;
    language: 'de' | 'en';
  };
  variant?: 'default' | 'compact' | 'featured';
}

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const locale = useLocale();
  const t = useTranslations();

  if (variant === 'compact') {
    return (
      <Link href={`/${locale}/article/${article.slug}`}>
        <Card className="flex overflow-hidden hover:shadow-md transition-shadow h-24">
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={article.thumbnail}
              alt={article.title}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
          <CardContent className="flex flex-col justify-center p-3 flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2">{article.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(article.publishDate, locale)}
            </p>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link href={`/${locale}/article/${article.slug}`}>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={article.thumbnail}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
              <Badge variant="secondary" className="mb-2">
                {t(`categories.${article.category}` as keyof IntlMessages)}
              </Badge>
              <h2 className="font-bold text-xl md:text-2xl line-clamp-2 mb-2">
                {article.title}
              </h2>
              <p className="text-sm text-white/80 line-clamp-2 hidden sm:block">
                {truncate(article.teaser, 150)}
              </p>
              <p className="text-xs text-white/60 mt-2">
                {formatDate(article.publishDate, locale)}
              </p>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/${locale}/article/${article.slug}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={article.thumbnail}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <CardContent className="flex-1 p-4">
          <Badge variant="outline" className="mb-2">
            {t(`categories.${article.category}` as keyof IntlMessages)}
          </Badge>
          <h3 className="font-semibold text-lg line-clamp-2 mb-2">{article.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {truncate(article.teaser, 120)}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <p className="text-xs text-muted-foreground">
            {formatDate(article.publishDate, locale)}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}
