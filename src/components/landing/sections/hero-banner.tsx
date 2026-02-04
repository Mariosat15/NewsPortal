'use client';

import Image from 'next/image';
import Link from 'next/link';
import { trackBannerClick, navigateToPortal } from '@/lib/tracking/tracker';

interface HeroBannerProps {
  image?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  overlayOpacity?: number;
  textAlign?: 'left' | 'center' | 'right';
  height?: 'small' | 'medium' | 'large' | 'full';
}

const heightClasses = {
  small: 'h-[300px] md:h-[400px]',
  medium: 'h-[400px] md:h-[500px]',
  large: 'h-[500px] md:h-[600px]',
  full: 'h-screen',
};

export function HeroBanner({
  image = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&h=900&fit=crop',
  title = 'Welcome to Our Portal',
  subtitle = 'Discover the latest news and updates',
  ctaText = 'Explore Now',
  ctaLink = '/',
  overlayOpacity = 0.5,
  textAlign = 'center',
  height = 'large',
}: HeroBannerProps) {
  const handleCtaClick = () => {
    trackBannerClick('hero-cta', ctaLink, 'hero');
    if (ctaLink.startsWith('/')) {
      navigateToPortal(ctaLink);
    }
  };

  return (
    <div className={`relative w-full ${heightClasses[height]} overflow-hidden`}>
      {/* Background Image */}
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover"
        priority
      />
      
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Content */}
      <div className={`relative h-full flex flex-col justify-center items-${textAlign === 'center' ? 'center' : textAlign === 'right' ? 'end' : 'start'} px-6 md:px-12`}>
        <div className={`max-w-3xl ${textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left'}`}>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">
              {subtitle}
            </p>
          )}
          {ctaText && ctaLink && (
            <button
              onClick={handleCtaClick}
              className="inline-block px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              {ctaText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
