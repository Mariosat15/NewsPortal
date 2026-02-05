// Header Components Index
export { StandardHeader } from './StandardHeader';
export { CenteredHeader } from './CenteredHeader';
export { SplitHeader } from './SplitHeader';
export { MinimalHeader } from './MinimalHeader';
export { MegaHeader } from './MegaHeader';
export { StickyCompactHeader } from './StickyCompactHeader';

import { HeaderStyle, HeaderProps } from '@/lib/templates/types';
import { StandardHeader } from './StandardHeader';
import { CenteredHeader } from './CenteredHeader';
import { SplitHeader } from './SplitHeader';
import { MinimalHeader } from './MinimalHeader';
import { MegaHeader } from './MegaHeader';
import { StickyCompactHeader } from './StickyCompactHeader';

export function getHeaderComponent(style: HeaderStyle) {
  const components = {
    standard: StandardHeader,
    centered: CenteredHeader,
    split: SplitHeader,
    minimal: MinimalHeader,
    mega: MegaHeader,
    'sticky-compact': StickyCompactHeader,
  };
  return components[style] || StandardHeader;
}
