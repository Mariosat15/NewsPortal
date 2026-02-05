// Navigation Components Index
export { HorizontalNav } from './HorizontalNav';
export { SidebarNav } from './SidebarNav';
export { MegaMenuNav } from './MegaMenuNav';
export { HamburgerNav } from './HamburgerNav';
export { TabbedNav } from './TabbedNav';

import { NavigationStyle, NavigationProps } from '@/lib/templates/types';
import { HorizontalNav } from './HorizontalNav';
import { SidebarNav } from './SidebarNav';
import { MegaMenuNav } from './MegaMenuNav';
import { HamburgerNav } from './HamburgerNav';
import { TabbedNav } from './TabbedNav';

export function getNavigationComponent(style: NavigationStyle) {
  const components = {
    horizontal: HorizontalNav,
    sidebar: SidebarNav,
    'mega-menu': MegaMenuNav,
    hamburger: HamburgerNav,
    tabbed: TabbedNav,
  };
  return components[style] || HorizontalNav;
}
