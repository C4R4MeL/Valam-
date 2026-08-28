// ============================================================
// Valam Insights — Utility Functions
// ============================================================

/**
 * Generate a URL-safe slug from a title string.
 * Handles Indonesian characters and common special chars.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^\w\s-]/g, '')      // Remove special chars
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');      // Trim leading/trailing hyphens
}

/**
 * Calculate estimated read time from markdown text.
 * Based on average 200 words per minute reading speed.
 */
export function calculateReadTime(markdown: string): number {
  if (!markdown) return 1;
  
  // Strip markdown syntax for word count
  const plainText = markdown
    .replace(/!\[.*?\]\(.*?\)/g, '')      // Images
    .replace(/\[.*?\]\(.*?\)/g, '$1')      // Links
    .replace(/[#*_`~>\-|]/g, '')           // Markdown chars
    .replace(/\n+/g, ' ')                  // Newlines
    .trim();

  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Get localized field value based on current locale.
 * Falls back to Indonesian if English version is not available.
 */
export function getLocalizedField(
  item: Record<string, any>,
  fieldBase: string,
  locale: string
): string {
  const enKey = `${fieldBase}_en`;
  const idKey = `${fieldBase}_id`;

  if (locale === 'en' && item[enKey]) {
    return item[enKey] as string;
  }
  return (item[idKey] as string) || '';
}

/**
 * Format a date string to a localized display format.
 */
export function formatDate(dateStr: string, locale: string = 'id'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format number with Indonesian locale (e.g., 850.000).
 */
export function formatPrice(price: number, currency: string = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Get content type display label.
 */
export function getContentTypeLabel(
  type: string,
  locale: string = 'id'
): string {
  const labels: Record<string, Record<string, string>> = {
    artikel: { id: 'Artikel', en: 'Article' },
    panduan: { id: 'Panduan', en: 'Guide' },
    cerita_koperasi: { id: 'Cerita Koperasi', en: 'Cooperative Story' },
  };
  return labels[type]?.[locale] || type;
}

/**
 * Get content status display label + color class.
 */
export function getStatusInfo(status: string): {
  label: string;
  colorClass: string;
} {
  switch (status) {
    case 'published':
      return { label: 'Published', colorClass: 'bg-emerald-100 text-emerald-800' };
    case 'draft':
      return { label: 'Draft', colorClass: 'bg-amber-100 text-amber-800' };
    case 'unpublished':
      return { label: 'Unpublished', colorClass: 'bg-zinc-100 text-zinc-600' };
    default:
      return { label: status, colorClass: 'bg-zinc-100 text-zinc-600' };
  }
}

/**
 * Truncate text to a maximum character count, preserving word boundaries.
 */
export function truncateText(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  return truncated.substring(0, truncated.lastIndexOf(' ')) + '…';
}
