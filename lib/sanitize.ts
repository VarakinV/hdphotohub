import DOMPurify from 'isomorphic-dompurify';

// Minimal allowlist for our WYSIWYG output
const ALLOWED_TAGS = [
  'p', 'br', 'b', 'strong', 'i', 'em',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3',
  'div', 'span', 'a'
];

const ALLOWED_ATTR = ['href', 'target', 'rel'];

export function sanitizeDescription(html: string): string {
  if (!html) return '';
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Block scripts/styles/iframes even if encountered
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    // Do not allow inline event handlers
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
    // Ensure links are safe
    ADD_ATTR: ['rel', 'target'],
  });
  return clean;
}

