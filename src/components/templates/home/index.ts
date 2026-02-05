// Home Layout Components Index
export { MagazineLayout } from './MagazineLayout';
export { GridHomepage } from './GridHomepage';
export { MasonryHomepage } from './MasonryHomepage';
export { CardsHomepage } from './CardsHomepage';
export { EditorialHomepage } from './EditorialHomepage';
export { MinimalHomepage } from './MinimalHomepage';

import { HomepageLayout, HomeLayoutProps } from '@/lib/templates/types';
import { MagazineLayout } from './MagazineLayout';
import { GridHomepage } from './GridHomepage';
import { MasonryHomepage } from './MasonryHomepage';
import { CardsHomepage } from './CardsHomepage';
import { EditorialHomepage } from './EditorialHomepage';
import { MinimalHomepage } from './MinimalHomepage';

export function getHomeLayoutComponent(layout: HomepageLayout) {
  const components = {
    magazine: MagazineLayout,
    grid: GridHomepage,
    masonry: MasonryHomepage,
    cards: CardsHomepage,
    editorial: EditorialHomepage,
    minimal: MinimalHomepage,
  };
  return components[layout] || MagazineLayout;
}
