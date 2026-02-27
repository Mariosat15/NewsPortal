/**
 * HTML sanitization using the battle-tested `sanitize-html` library.
 *
 * Used for content rendered via dangerouslySetInnerHTML.
 * Content typically comes from trusted admin/AI sources, but
 * defense-in-depth protects against database compromise.
 *
 * Works on both server (Node.js) and client (browser).
 */
import sanitize from 'sanitize-html';

const SANITIZE_OPTIONS: sanitize.IOptions = {
  allowedTags: [
    // Block elements
    'p', 'div', 'span', 'br', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre', 'code',
    // Lists
    'ul', 'ol', 'li',
    // Inline formatting
    'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small',
    // Links and images
    'a', 'img',
    // Media
    'figure', 'figcaption', 'picture', 'source', 'video', 'audio',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    // Details
    'details', 'summary',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    video: ['src', 'poster', 'controls', 'width', 'height'],
    audio: ['src', 'controls'],
    source: ['src', 'type', 'media'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    // Allow class on most elements for styling
    '*': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Force rel="noopener noreferrer" on links for security
  transformTags: {
    a: sanitize.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

/**
 * Sanitize HTML content — removes dangerous tags, attributes, and protocols.
 * Safe for use with dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return sanitize(html, SANITIZE_OPTIONS);
}

/**
 * Escape a plain string for safe insertion into HTML.
 * Used for user-supplied values injected into HTML templates.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
