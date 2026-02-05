// Card Components Index
export { StandardCard } from './StandardCard';
export { CompactCard } from './CompactCard';
export { OverlayCard } from './OverlayCard';
export { HorizontalCard } from './HorizontalCard';
export { MinimalCard } from './MinimalCard';
export { BoldCard } from './BoldCard';

import { ArticleCardStyle, ArticleCardProps } from '@/lib/templates/types';
import { StandardCard } from './StandardCard';
import { CompactCard } from './CompactCard';
import { OverlayCard } from './OverlayCard';
import { HorizontalCard } from './HorizontalCard';
import { MinimalCard } from './MinimalCard';
import { BoldCard } from './BoldCard';

export function getCardComponent(style: ArticleCardStyle) {
  const components = {
    standard: StandardCard,
    compact: CompactCard,
    overlay: OverlayCard,
    horizontal: HorizontalCard,
    minimal: MinimalCard,
    bold: BoldCard,
  };
  return components[style] || StandardCard;
}
