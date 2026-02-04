'use client';

import Image from 'next/image';
import { trackBannerClick, navigateToPortal } from '@/lib/tracking/tracker';

interface BannerConfig {
  id: string;
  image: string;
  link: string;
  position?: string;
  altText?: string;
}

interface BannerStripProps {
  banners: BannerConfig[];
  layout?: 'single' | 'double' | 'triple';
  height?: 'small' | 'medium' | 'large';
}

const heightClasses = {
  small: 'h-24 md:h-32',
  medium: 'h-32 md:h-48',
  large: 'h-48 md:h-64',
};

const layoutClasses = {
  single: 'grid-cols-1',
  double: 'grid-cols-1 md:grid-cols-2',
  triple: 'grid-cols-1 md:grid-cols-3',
};

export function BannerStrip({
  banners,
  layout = 'triple',
  height = 'medium',
}: BannerStripProps) {
  const handleBannerClick = (banner: BannerConfig) => {
    trackBannerClick(banner.id, banner.link, banner.position);
    if (banner.link.startsWith('/')) {
      navigateToPortal(banner.link);
    } else {
      window.location.href = banner.link;
    }
  };

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-4 md:px-6 bg-gray-100">
      <div className={`grid ${layoutClasses[layout]} gap-4 max-w-7xl mx-auto`}>
        {banners.map((banner) => (
          <div
            key={banner.id}
            onClick={() => handleBannerClick(banner)}
            className={`relative ${heightClasses[height]} rounded-lg overflow-hidden cursor-pointer group`}
          >
            <Image
              src={banner.image}
              alt={banner.altText || 'Banner'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        ))}
      </div>
    </section>
  );
}
