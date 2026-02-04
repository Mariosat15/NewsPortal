'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Clock, ArrowRight } from 'lucide-react';

interface Article {
  slug: string;
  title: string;
  teaser: string;
  thumbnail: string;
  category: string;
  publishDate: string;
}

interface HeroSliderProps {
  articles: Article[];
  locale: string;
  categoryLabels: Record<string, string>;
  autoPlay?: boolean;
  interval?: number;
}

const categoryGradients: Record<string, string> = {
  news: 'from-slate-600 to-slate-800',
  technology: 'from-blue-500 to-indigo-600',
  health: 'from-emerald-500 to-teal-600',
  finance: 'from-amber-500 to-orange-600',
  sports: 'from-red-500 to-rose-600',
  lifestyle: 'from-purple-500 to-violet-600',
  entertainment: 'from-pink-500 to-fuchsia-600',
};

const categoryIcons: Record<string, string> = {
  news: '📰',
  technology: '💻',
  health: '🏥',
  finance: '💰',
  sports: '⚽',
  lifestyle: '✨',
  entertainment: '🎬',
};

export function HeroSlider({ 
  articles, 
  locale, 
  categoryLabels,
  autoPlay = true, 
  interval = 5000 
}: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % articles.length);
  }, [articles.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
  }, [articles.length]);

  useEffect(() => {
    if (!autoPlay || isHovered || articles.length <= 1) return;
    
    const timer = setInterval(nextSlide, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, isHovered, nextSlide, articles.length]);

  if (articles.length === 0) return null;

  const currentArticle = articles[currentIndex];

  return (
    <section 
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Slider */}
      <div className="relative h-[450px] md:h-[500px] lg:h-[550px] overflow-hidden rounded-2xl">
        {articles.map((article, index) => (
          <div
            key={article.slug}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentIndex 
                ? 'opacity-100 translate-x-0' 
                : index < currentIndex 
                  ? 'opacity-0 -translate-x-full' 
                  : 'opacity-0 translate-x-full'
            }`}
          >
            <Link href={`/${locale}/article/${article.slug}`} className="group block h-full">
              <Image
                src={article.thumbnail}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                priority={index === 0}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12">
                <div className="max-w-3xl">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold mb-4 bg-gradient-to-r ${categoryGradients[article.category] || 'from-blue-500 to-indigo-600'} text-white shadow-lg`}>
                    <span>{categoryIcons[article.category]}</span>
                    {categoryLabels[article.category] || article.category}
                  </span>
                  
                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 line-clamp-3 group-hover:text-blue-200 transition-colors">
                    {article.title}
                  </h1>
                  
                  <p className="text-white/80 text-base md:text-lg line-clamp-2 max-w-2xl mb-4 hidden sm:block">
                    {article.teaser}
                  </p>
                  
                  <div className="flex items-center gap-4 text-white/70 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {new Date(article.publishDate).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-300 font-medium group-hover:gap-2 transition-all">
                      {locale === 'de' ? 'Weiterlesen' : 'Read more'}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}

        {/* Navigation Arrows */}
        {articles.length > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); prevSlide(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); nextSlide(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {articles.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            {articles.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.preventDefault(); setCurrentIndex(index); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white w-6' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {articles.length > 1 && (
        <div className="hidden md:flex gap-3 mt-4">
          {articles.map((article, index) => (
            <button
              key={article.slug}
              onClick={() => setCurrentIndex(index)}
              className={`flex-1 group relative rounded-lg overflow-hidden transition-all ${
                index === currentIndex 
                  ? 'ring-2 ring-blue-500 ring-offset-2' 
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <div className="relative aspect-[16/9]">
                <Image
                  src={article.thumbnail}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-xs font-medium line-clamp-2">{article.title}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
