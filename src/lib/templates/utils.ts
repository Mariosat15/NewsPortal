// Template Utility Functions for Consistent Spacing, Typography, and Styling

import { ResolvedTemplate, TemplateColors, TypographyScale } from './types';

// =============================================================================
// SPACING UTILITIES
// =============================================================================

export interface SpacingScale {
  xs: string;      // 2-4px  - tight spacing
  sm: string;      // 4-8px  - small gaps
  md: string;      // 8-16px - default spacing
  lg: string;      // 16-32px - section padding
  xl: string;      // 24-48px - large sections
  '2xl': string;   // 32-64px - major sections
  section: string; // template.spacing.sectionGap
  card: string;    // template.spacing.cardGap
  container: string; // template.spacing.containerMax
  header: string;  // template.spacing.headerHeight
}

/**
 * Get a spacing scale based on the template's typography scale setting.
 * Returns CSS values for consistent spacing throughout the template.
 */
export function getSpacingScale(template: ResolvedTemplate): SpacingScale {
  const scale = template.typography.scale;
  
  // Base unit varies by scale
  const base = scale === 'compact' ? 4 : scale === 'spacious' ? 8 : 6;
  
  return {
    xs: `${base * 0.5}px`,     // 2-4px
    sm: `${base}px`,           // 4-8px
    md: `${base * 2}px`,       // 8-16px
    lg: `${base * 4}px`,       // 16-32px
    xl: `${base * 6}px`,       // 24-48px
    '2xl': `${base * 8}px`,    // 32-64px
    section: template.spacing.sectionGap,
    card: template.spacing.cardGap,
    container: template.spacing.containerMax,
    header: template.spacing.headerHeight,
  };
}

/**
 * Get spacing as inline style object for React components.
 */
export function getSpacingStyle(
  template: ResolvedTemplate,
  options: {
    padding?: keyof SpacingScale | [keyof SpacingScale, keyof SpacingScale];
    margin?: keyof SpacingScale | [keyof SpacingScale, keyof SpacingScale];
    gap?: keyof SpacingScale;
    paddingX?: keyof SpacingScale;
    paddingY?: keyof SpacingScale;
    marginX?: keyof SpacingScale;
    marginY?: keyof SpacingScale;
  }
): React.CSSProperties {
  const scale = getSpacingScale(template);
  const style: React.CSSProperties = {};
  
  if (options.padding) {
    if (Array.isArray(options.padding)) {
      style.padding = `${scale[options.padding[0]]} ${scale[options.padding[1]]}`;
    } else {
      style.padding = scale[options.padding];
    }
  }
  
  if (options.margin) {
    if (Array.isArray(options.margin)) {
      style.margin = `${scale[options.margin[0]]} ${scale[options.margin[1]]}`;
    } else {
      style.margin = scale[options.margin];
    }
  }
  
  if (options.gap) {
    style.gap = scale[options.gap];
  }
  
  if (options.paddingX) {
    style.paddingLeft = scale[options.paddingX];
    style.paddingRight = scale[options.paddingX];
  }
  
  if (options.paddingY) {
    style.paddingTop = scale[options.paddingY];
    style.paddingBottom = scale[options.paddingY];
  }
  
  if (options.marginX) {
    style.marginLeft = scale[options.marginX];
    style.marginRight = scale[options.marginX];
  }
  
  if (options.marginY) {
    style.marginTop = scale[options.marginY];
    style.marginBottom = scale[options.marginY];
  }
  
  return style;
}

// =============================================================================
// TYPOGRAPHY UTILITIES
// =============================================================================

export interface TypographySize {
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  body: string;
  small: string;
  caption: string;
}

export interface TypographyLineHeight {
  tight: number;    // Headlines
  snug: number;     // Subheadlines
  normal: number;   // Body text
  relaxed: number;  // Comfortable reading
}

/**
 * Get typography sizes based on template scale.
 */
export function getTypographySizes(scale: TypographyScale): TypographySize {
  const sizes: Record<TypographyScale, TypographySize> = {
    compact: {
      h1: '2rem',      // 32px
      h2: '1.5rem',    // 24px
      h3: '1.25rem',   // 20px
      h4: '1.125rem',  // 18px
      body: '0.875rem', // 14px
      small: '0.8125rem', // 13px
      caption: '0.75rem', // 12px
    },
    normal: {
      h1: '2.5rem',    // 40px
      h2: '1.875rem',  // 30px
      h3: '1.5rem',    // 24px
      h4: '1.25rem',   // 20px
      body: '1rem',    // 16px
      small: '0.875rem', // 14px
      caption: '0.8125rem', // 13px
    },
    spacious: {
      h1: '3rem',      // 48px
      h2: '2.25rem',   // 36px
      h3: '1.75rem',   // 28px
      h4: '1.375rem',  // 22px
      body: '1.125rem', // 18px
      small: '1rem',   // 16px
      caption: '0.875rem', // 14px
    },
  };
  
  return sizes[scale];
}

/**
 * Get line heights for typography.
 */
export function getLineHeights(): TypographyLineHeight {
  return {
    tight: 1.15,    // Headlines
    snug: 1.3,      // Subheadlines
    normal: 1.5,    // Body text
    relaxed: 1.7,   // Long-form content
  };
}

/**
 * Get complete typography style for a specific element type.
 */
export function getTypographyStyle(
  template: ResolvedTemplate,
  element: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'caption',
  options?: {
    weight?: number;
    color?: keyof TemplateColors;
    muted?: boolean;
  }
): React.CSSProperties {
  const sizes = getTypographySizes(template.typography.scale);
  const lineHeights = getLineHeights();
  const colors = template.activeColors;
  
  const isHeading = ['h1', 'h2', 'h3', 'h4'].includes(element);
  
  return {
    fontSize: sizes[element],
    fontFamily: isHeading ? template.typography.headingFont : template.typography.bodyFont,
    fontWeight: options?.weight ?? (isHeading ? template.typography.headingWeight : 400),
    lineHeight: isHeading ? lineHeights.tight : lineHeights.normal,
    color: options?.muted 
      ? colors.textMuted 
      : (options?.color ? colors[options.color] : colors.text),
  };
}

// =============================================================================
// BORDER RADIUS UTILITIES
// =============================================================================

/**
 * Get border radius value based on template features.
 */
export function getBorderRadius(template: ResolvedTemplate, size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md'): string {
  const cornerSetting = template.features.roundedCorners;
  
  if (cornerSetting === 'none') return '0';
  if (cornerSetting === 'full') return '9999px';
  
  // cornerSetting is guaranteed to be 'sm' | 'md' | 'lg' here due to early returns above
  const radiusMap: Record<'sm' | 'md' | 'lg', Record<typeof size, string>> = {
    sm: { sm: '2px', md: '4px', lg: '6px', xl: '8px', full: '9999px' },
    md: { sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
    lg: { sm: '8px', md: '12px', lg: '16px', xl: '24px', full: '9999px' },
  };
  
  return radiusMap[cornerSetting as 'sm' | 'md' | 'lg'][size];
}

// =============================================================================
// SHADOW UTILITIES
// =============================================================================

/**
 * Get shadow value based on template features.
 */
export function getShadow(template: ResolvedTemplate, intensity: 'subtle' | 'medium' | 'strong' | 'none' = 'medium'): string {
  const shadowSetting = template.features.shadows;
  
  if (shadowSetting === 'none' || intensity === 'none') return 'none';
  
  // After early return, shadowSetting and intensity are guaranteed to be 'subtle' | 'medium' | 'strong'
  type ValidShadow = 'subtle' | 'medium' | 'strong';
  const shadowMap: Record<ValidShadow, Record<ValidShadow, string>> = {
    subtle: {
      subtle: '0 1px 2px rgba(0,0,0,0.04)',
      medium: '0 2px 4px rgba(0,0,0,0.06)',
      strong: '0 4px 8px rgba(0,0,0,0.08)',
    },
    medium: {
      subtle: '0 2px 4px rgba(0,0,0,0.06)',
      medium: '0 4px 12px rgba(0,0,0,0.1)',
      strong: '0 8px 24px rgba(0,0,0,0.15)',
    },
    strong: {
      subtle: '0 4px 8px rgba(0,0,0,0.1)',
      medium: '0 8px 24px rgba(0,0,0,0.15)',
      strong: '0 16px 48px rgba(0,0,0,0.2)',
    },
  };
  
  return shadowMap[shadowSetting as ValidShadow][intensity as ValidShadow];
}

// =============================================================================
// CONTAINER UTILITIES
// =============================================================================

/**
 * Get container styles with proper max-width and padding.
 */
export function getContainerStyle(template: ResolvedTemplate): React.CSSProperties {
  return {
    maxWidth: template.spacing.containerMax,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: '1rem',
    paddingRight: '1rem',
  };
}

// =============================================================================
// SECTION UTILITIES
// =============================================================================

/**
 * Get section styles for consistent vertical rhythm.
 */
export function getSectionStyle(
  template: ResolvedTemplate, 
  options?: { 
    withContainer?: boolean;
    background?: 'default' | 'surface' | 'surfaceAlt';
  }
): React.CSSProperties {
  const colors = template.activeColors;
  const style: React.CSSProperties = {
    paddingTop: template.spacing.sectionGap,
    paddingBottom: template.spacing.sectionGap,
  };
  
  if (options?.withContainer) {
    Object.assign(style, getContainerStyle(template));
  }
  
  if (options?.background) {
    const bgMap = {
      default: colors.background,
      surface: colors.surface,
      surfaceAlt: colors.surfaceAlt,
    };
    style.backgroundColor = bgMap[options.background];
  }
  
  return style;
}

// =============================================================================
// CARD UTILITIES
// =============================================================================

/**
 * Get card styles with shadow, border radius, and background.
 */
export function getCardStyle(
  template: ResolvedTemplate,
  options?: {
    hover?: boolean;
    elevated?: boolean;
  }
): React.CSSProperties {
  const colors = template.activeColors;
  
  return {
    backgroundColor: colors.surface,
    borderRadius: getBorderRadius(template, 'lg'),
    boxShadow: getShadow(template, options?.elevated ? 'strong' : 'medium'),
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
    transition: options?.hover ? 'box-shadow 0.2s ease, transform 0.2s ease' : undefined,
  };
}

// =============================================================================
// GRID UTILITIES
// =============================================================================

/**
 * Get grid styles for article layouts.
 */
export function getGridStyle(
  template: ResolvedTemplate,
  columns: number = 4
): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: template.spacing.cardGap,
  };
}

// =============================================================================
// SECTION HEADER UTILITIES
// =============================================================================

/**
 * Get section header styles with decorative elements.
 */
export function getSectionHeaderStyle(
  template: ResolvedTemplate,
  variant: 'default' | 'underline' | 'badge' | 'line' = 'default'
): {
  container: React.CSSProperties;
  title: React.CSSProperties;
  decoration?: React.CSSProperties;
} {
  const colors = template.activeColors;
  const typography = getTypographyStyle(template, 'h3', { weight: 700 });
  
  const base = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: template.spacing.cardGap,
    } as React.CSSProperties,
    title: typography,
  };
  
  switch (variant) {
    case 'underline':
      return {
        ...base,
        decoration: {
          position: 'absolute' as const,
          bottom: 0,
          left: 0,
          height: '3px',
          width: '60px',
          backgroundColor: colors.accent,
        },
      };
    case 'badge':
      return {
        container: {
          marginBottom: template.spacing.cardGap,
        },
        title: {
          ...typography,
          display: 'inline-block',
          padding: '8px 16px',
          backgroundColor: colors.accent,
          color: '#ffffff',
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderRadius: getBorderRadius(template, 'sm'),
        },
      };
    case 'line':
      return {
        ...base,
        decoration: {
          flex: 1,
          height: '1px',
          backgroundColor: colors.border,
        },
      };
    default:
      return base;
  }
}

// =============================================================================
// RESPONSIVE UTILITIES
// =============================================================================

/**
 * Standard breakpoints for responsive design.
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Get responsive grid columns based on breakpoint.
 */
export function getResponsiveColumns(
  base: number = 1,
  sm?: number,
  md?: number,
  lg?: number,
  xl?: number
): string {
  // This returns a class string for Tailwind
  let classes = `grid-cols-${base}`;
  if (sm) classes += ` sm:grid-cols-${sm}`;
  if (md) classes += ` md:grid-cols-${md}`;
  if (lg) classes += ` lg:grid-cols-${lg}`;
  if (xl) classes += ` xl:grid-cols-${xl}`;
  return classes;
}

// =============================================================================
// COLOR UTILITIES
// =============================================================================

/**
 * Get a color with opacity.
 */
export function getColorWithOpacity(color: string, opacity: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  // Return as-is for other formats
  return color;
}

/**
 * Get gradient overlay for hero images.
 */
export function getHeroOverlayGradient(direction: 'top' | 'bottom' | 'left' | 'right' = 'bottom'): string {
  const dirMap = {
    top: 'to-t',
    bottom: 'to-b',
    left: 'to-l',
    right: 'to-r',
  };
  return `linear-gradient(${dirMap[direction]}, transparent 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.85) 100%)`;
}

// =============================================================================
// HOVER STATE UTILITIES
// =============================================================================

/**
 * Get hover state styles (for use with CSS-in-JS or inline styles).
 */
export function getHoverStateCSS(template: ResolvedTemplate): string {
  return `
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${getShadow(template, 'strong')};
    }
  `;
}

// =============================================================================
// ANIMATION UTILITIES
// =============================================================================

/**
 * Get animation settings based on template features.
 */
export function getAnimationDuration(template: ResolvedTemplate): string {
  return template.features.animations ? '0.3s' : '0s';
}

export function getAnimationStyle(template: ResolvedTemplate): React.CSSProperties {
  if (!template.features.animations) return {};
  
  return {
    transition: 'all 0.3s ease',
  };
}
