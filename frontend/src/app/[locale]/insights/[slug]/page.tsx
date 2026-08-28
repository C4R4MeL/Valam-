import { Metadata } from 'next';
import { ArticleDetail } from './ArticleDetail';

// Dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}): Promise<Metadata> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = createClient();

  const { data } = await supabase
    .from('insights_content')
    .select('title_id, title_en, excerpt_id, excerpt_en, cover_image_url, published_at, insights_authors(name)')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!data) {
    return {
      title: 'Valam Insights',
      description: 'Content not found',
    };
  }

  const isEn = params.locale === 'en';
  const title = isEn && data.title_en ? data.title_en : data.title_id;
  const description = isEn && data.excerpt_en ? data.excerpt_en : data.excerpt_id;

  return {
    title: `${title} — Valam Insights`,
    description: description || 'Baca selengkapnya di Valam Insights',
    openGraph: {
      title: `${title} — Valam Insights`,
      description: description || undefined,
      type: 'article',
      images: data.cover_image_url ? [{ url: data.cover_image_url }] : [],
      publishedTime: data.published_at || undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — Valam Insights`,
      description: description || undefined,
      images: data.cover_image_url ? [data.cover_image_url] : [],
    },
  };
}

export default async function InsightArticlePage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  // Fetch data server-side for JSON-LD structured data
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = createClient();

  const { data } = await supabase
    .from('insights_content')
    .select('title_id, title_en, excerpt_id, excerpt_en, cover_image_url, published_at, updated_at, insights_authors(name)')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  const isEn = params.locale === 'en';
  const title = data ? (isEn && data.title_en ? data.title_en : data.title_id) : '';
  const description = data ? (isEn && data.excerpt_en ? data.excerpt_en : data.excerpt_id) : '';
  const authorName = (data?.insights_authors as any)?.name || 'Tim Valam';

  // JSON-LD structured data for search engine rich snippets
  const jsonLd = data
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description: description || undefined,
        image: data.cover_image_url || undefined,
        datePublished: data.published_at || undefined,
        dateModified: data.updated_at || undefined,
        author: {
          '@type': 'Person',
          name: authorName,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Valam',
          logo: {
            '@type': 'ImageObject',
            url: 'https://valam.id/favicon.ico',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://valam.id/${params.locale}/insights/${params.slug}`,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ArticleDetail slug={params.slug} />
    </>
  );
}
