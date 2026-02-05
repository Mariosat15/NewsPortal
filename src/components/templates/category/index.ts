// Category Layout Components Index
export { GridLayout } from './GridLayout';
export { ListLayout } from './ListLayout';
export { MasonryLayout } from './MasonryLayout';
export { FeaturedGridLayout } from './FeaturedGridLayout';
export { TimelineLayout } from './TimelineLayout';

import { CategoryLayout, CategoryLayoutProps } from '@/lib/templates/types';
import { GridLayout } from './GridLayout';
import { ListLayout } from './ListLayout';
import { MasonryLayout } from './MasonryLayout';
import { FeaturedGridLayout } from './FeaturedGridLayout';
import { TimelineLayout } from './TimelineLayout';

export function getCategoryLayoutComponent(layout: CategoryLayout) {
  const components = {
    grid: GridLayout,
    list: ListLayout,
    masonry: MasonryLayout,
    'featured-grid': FeaturedGridLayout,
    timeline: TimelineLayout,
  };
  return components[layout] || GridLayout;
}
