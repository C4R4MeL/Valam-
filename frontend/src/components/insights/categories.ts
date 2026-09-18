/** Thematic insight categories for hub navigation / filtering. */

export type InsightCategoryId =
  | 'all'
  | 'harga-pasar'
  | 'kualitas'
  | 'produksi'
  | 'supply-chain'
  | 'industri-global';

export interface InsightCategory {
  id: InsightCategoryId;
  labelId: string;
  labelEn: string;
  /** Primary Supabase tag slugs used for API filtering when possible */
  tagSlugs: string[];
  /** Fallback title/excerpt keywords (ID + EN) for client-side matching */
  keywords: string[];
}

export const INSIGHT_CATEGORIES: InsightCategory[] = [
  {
    id: 'all',
    labelId: 'Semua',
    labelEn: 'All',
    tagSlugs: [],
    keywords: [],
  },
  {
    id: 'harga-pasar',
    labelId: 'Harga & Pasar',
    labelEn: 'Price & Market',
    tagSlugs: ['harga-pasar'],
    keywords: ['harga', 'pasar', 'price', 'market', 'tren'],
  },
  {
    id: 'kualitas',
    labelId: 'Kualitas',
    labelEn: 'Quality',
    tagSlugs: ['standardisasi', 'nilam-organik'],
    keywords: [
      'kualitas',
      'quality',
      'patchouli alcohol',
      'pa',
      'gc-ms',
      'kadar',
      'purity',
    ],
  },
  {
    id: 'produksi',
    labelId: 'Produksi',
    labelEn: 'Production',
    tagSlugs: ['budidaya', 'distilasi', 'hama-penyakit'],
    keywords: [
      'produksi',
      'production',
      'budidaya',
      'distilasi',
      'penyulingan',
      'pembibitan',
      'hama',
    ],
  },
  {
    id: 'supply-chain',
    labelId: 'Supply Chain',
    labelEn: 'Supply Chain',
    tagSlugs: ['kisah-koperasi'],
    keywords: [
      'supply',
      'rantai',
      'pasok',
      'petani',
      'koperasi',
      'batch',
      'traceability',
      'ketertelusuran',
    ],
  },
  {
    id: 'industri-global',
    labelId: 'Industri Global',
    labelEn: 'Global Industry',
    tagSlugs: ['standardisasi'],
    keywords: [
      'global',
      'ekspor',
      'export',
      'eropa',
      'internasional',
      'fragrance',
      'uni eropa',
    ],
  },
];

export function getCategoryLabel(
  id: InsightCategoryId,
  isEn: boolean
): string {
  const cat = INSIGHT_CATEGORIES.find((c) => c.id === id);
  if (!cat) return id;
  return isEn ? cat.labelEn : cat.labelId;
}

/** Resolve display category for an article from tags / title. */
export function resolveArticleCategory(
  article: {
    title_id?: string | null;
    title_en?: string | null;
    excerpt_id?: string | null;
    excerpt_en?: string | null;
    insights_content_tags?: Array<{
      insights_tags?: { slug?: string | null; name?: string | null } | null;
    }> | null;
  },
  isEn: boolean
): { id: InsightCategoryId; label: string } {
  const tagSlugs =
    article.insights_content_tags
      ?.map((t) => t.insights_tags?.slug)
      .filter(Boolean) as string[] || [];

  const haystack = [
    article.title_id,
    article.title_en,
    article.excerpt_id,
    article.excerpt_en,
    ...tagSlugs,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  for (const cat of INSIGHT_CATEGORIES) {
    if (cat.id === 'all') continue;
    const tagHit = cat.tagSlugs.some((s) => tagSlugs.includes(s));
    const keywordHit = cat.keywords.some((k) => haystack.includes(k.toLowerCase()));
    if (tagHit || keywordHit) {
      return { id: cat.id, label: isEn ? cat.labelEn : cat.labelId };
    }
  }

  return {
    id: 'all',
    label: isEn ? 'Insight' : 'Wawasan',
  };
}

export function articleMatchesCategory(
  article: {
    title_id?: string | null;
    title_en?: string | null;
    excerpt_id?: string | null;
    excerpt_en?: string | null;
    insights_content_tags?: Array<{
      insights_tags?: { slug?: string | null } | null;
    }> | null;
  },
  categoryId: InsightCategoryId
): boolean {
  if (categoryId === 'all') return true;
  const cat = INSIGHT_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return true;

  const tagSlugs =
    article.insights_content_tags
      ?.map((t) => t.insights_tags?.slug)
      .filter(Boolean) as string[] || [];

  if (cat.tagSlugs.some((s) => tagSlugs.includes(s))) return true;

  const haystack = [
    article.title_id,
    article.title_en,
    article.excerpt_id,
    article.excerpt_en,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return cat.keywords.some((k) => haystack.includes(k.toLowerCase()));
}
