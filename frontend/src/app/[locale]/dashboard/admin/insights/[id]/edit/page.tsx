'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  ArrowLeft, Save, Send, Image as ImageIcon, Plus, X, Tag, FileText, Eye,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import {
  updateContent,
  getAllTags,
  findOrCreateTag,
  uploadInsightImage,
} from '@/lib/valam-insights/insights-api';
import { generateSlug } from '@/lib/valam-insights/utils';
import { createClient } from '@/lib/supabase/client';
import type {
  ContentType,
  ContentStatus,
  InsightTag,
  InsightContentWithAuthor,
  ContentFormData,
} from '@/lib/valam-insights/types';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'artikel', label: 'Artikel' },
  { value: 'panduan', label: 'Panduan' },
  { value: 'cerita_koperasi', label: 'Cerita Koperasi' },
];

export default function EditInsightPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const contentId = params.id as string;

  // Form state
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState<ContentType>('artikel');
  const [titleId, setTitleId] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slug, setSlug] = useState('');
  const [excerptId, setExcerptId] = useState('');
  const [excerptEn, setExcerptEn] = useState('');
  const [bodyId, setBodyId] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [verifiedBadge, setVerifiedBadge] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ContentStatus>('draft');
  const [activeBodyTab, setActiveBodyTab] = useState<'id' | 'en'>('id');

  // Tags
  const [allTags, setAllTags] = useState<InsightTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');

  // CTAs
  const [ctas, setCtas] = useState<{ label_id: string; label_en: string; target_url: string }[]>([]);

  // Upload
  const [coverUploading, setCoverUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch existing content
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('insights_content')
          .select(`
            *,
            insights_content_tags(tag_id, insights_tags(*)),
            insights_content_cta(*)
          `)
          .eq('id', contentId)
          .single();

        if (error || !data) throw error || new Error('Not found');

        const content = data as InsightContentWithAuthor;
        setContentType(content.content_type);
        setTitleId(content.title_id);
        setTitleEn(content.title_en || '');
        setSlug(content.slug);
        setExcerptId(content.excerpt_id || '');
        setExcerptEn(content.excerpt_en || '');
        setBodyId(content.body_id || '');
        setBodyEn(content.body_en || '');
        setCoverImageUrl(content.cover_image_url || '');
        setVerifiedBadge(content.verified_badge);
        setCurrentStatus(content.status);

        // Tags
        const tagIds = (content.insights_content_tags || []).map(
          (ct: any) => ct.tag_id
        );
        setSelectedTags(tagIds);

        // CTAs
        const existingCtas = (content.insights_content_cta || []).map((c: any) => ({
          label_id: c.label_id || '',
          label_en: c.label_en || '',
          target_url: c.target_url,
        }));
        setCtas(existingCtas);

        // Load all tags
        const tags = await getAllTags();
        setAllTags(tags);
      } catch (err) {
        console.error('Failed to load content:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [contentId]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const path = `covers/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const url = await uploadInsightImage(file, path);
      setCoverImageUrl(url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Gagal upload gambar.');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const tag = await findOrCreateTag(newTagName.trim(), generateSlug(newTagName.trim()));
      if (!selectedTags.includes(tag.id)) {
        setSelectedTags((prev) => [...prev, tag.id]);
      }
      if (!allTags.find((t) => t.id === tag.id)) {
        setAllTags((prev) => [...prev, tag]);
      }
      setNewTagName('');
    } catch (err) {
      console.error('Failed to create tag:', err);
    }
  };

  const handleSave = async (status: ContentStatus) => {
    if (!titleId.trim() || !slug.trim()) {
      alert('Judul dan slug wajib diisi!');
      return;
    }

    setSaving(true);
    try {
      const formData: ContentFormData = {
        content_type: contentType,
        status,
        slug,
        title_id: titleId,
        title_en: titleEn || undefined,
        excerpt_id: excerptId || undefined,
        excerpt_en: excerptEn || undefined,
        body_id: bodyId || undefined,
        body_en: bodyEn || undefined,
        cover_image_url: coverImageUrl || undefined,
        author_type: 'admin',
        verified_badge: verifiedBadge,
        tag_ids: selectedTags,
        cta: ctas.filter((c) => c.target_url),
      };

      await updateContent(contentId, formData);
      router.push(`/${locale}/dashboard/admin/insights`);
    } catch (err: any) {
      console.error('Failed to save:', err);
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin/insights"
            className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Edit Konten</h1>
            <p className="text-sm text-zinc-500">/{slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentStatus === 'published' && (
            <Link
              href={`/insights/${slug}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-all"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Link>
          )}
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            Simpan Draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
            Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form — same structure as create */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Type */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <label className="block text-sm font-semibold text-zinc-800 mb-3">Jenis Konten</label>
            <div className="flex gap-2">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setContentType(type.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    contentType === type.value
                      ? 'bg-emerald-800 text-white shadow-md'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Slug */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-800 mb-2">
                Judul (Indonesia) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={titleId}
                onChange={(e) => setTitleId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-800 mb-2">Judul (English)</label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-800 mb-2">Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">/insights/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-800">Ringkasan</h3>
            <textarea
              value={excerptId}
              onChange={(e) => setExcerptId(e.target.value)}
              placeholder="Ringkasan (ID)..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
            />
            <textarea
              value={excerptEn}
              onChange={(e) => setExcerptEn(e.target.value)}
              placeholder="Summary (EN)..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
            />
          </div>

          {/* Body */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-800">
                <FileText className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Body (Markdown)
              </h3>
              <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveBodyTab('id')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeBodyTab === 'id' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-500'
                  }`}
                >
                  🇮🇩 ID
                </button>
                <button
                  onClick={() => setActiveBodyTab('en')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeBodyTab === 'en' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-500'
                  }`}
                >
                  🇬🇧 EN
                </button>
              </div>
            </div>
            <div data-color-mode="light">
              {activeBodyTab === 'id' ? (
                <MDEditor value={bodyId} onChange={(v) => setBodyId(v || '')} height={400} preview="edit" />
              ) : (
                <MDEditor value={bodyEn} onChange={(v) => setBodyEn(v || '')} height={400} preview="edit" />
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-800">CTA</h3>
              <button
                onClick={() => setCtas((p) => [...p, { label_id: '', label_en: '', target_url: '' }])}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
              >
                <Plus className="w-3 h-3" /> Tambah
              </button>
            </div>
            <div className="space-y-3">
              {ctas.map((cta, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input type="text" value={cta.label_id} onChange={(e) => { const u = [...ctas]; u[i].label_id = e.target.value; setCtas(u); }} placeholder="Label ID" className="px-3 py-2 rounded-lg border border-zinc-200 text-sm" />
                    <input type="text" value={cta.label_en} onChange={(e) => { const u = [...ctas]; u[i].label_en = e.target.value; setCtas(u); }} placeholder="Label EN" className="px-3 py-2 rounded-lg border border-zinc-200 text-sm" />
                    <input type="url" value={cta.target_url} onChange={(e) => { const u = [...ctas]; u[i].target_url = e.target.value; setCtas(u); }} placeholder="URL" className="px-3 py-2 rounded-lg border border-zinc-200 text-sm" />
                  </div>
                  <button onClick={() => setCtas((p) => p.filter((_, j) => j !== i))} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cover Image */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 className="text-sm font-semibold text-zinc-800 mb-3">
              <ImageIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Cover
            </h3>
            {coverImageUrl ? (
              <div className="relative rounded-xl overflow-hidden mb-3">
                <img src={coverImageUrl} alt="Cover" className="w-full aspect-[16/10] object-cover" />
                <button onClick={() => setCoverImageUrl('')} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 text-center hover:border-emerald-300">
                  {coverUploading ? (
                    <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-sm text-zinc-500">Upload cover</p>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 className="text-sm font-semibold text-zinc-800 mb-3">
              <Tag className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Tags
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.map((tagId) => {
                const tag = allTags.find((t) => t.id === tagId);
                if (!tag) return null;
                return (
                  <span key={tag.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium">
                    {tag.name}
                    <button onClick={() => setSelectedTags((p) => p.filter((id) => id !== tagId))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} placeholder="Tag baru..." className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              <button onClick={handleAddTag} className="p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200"><Plus className="w-4 h-4" /></button>
            </div>
            {allTags.filter((t) => !selectedTags.includes(t.id)).length > 0 && (
              <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
                {allTags.filter((t) => !selectedTags.includes(t.id)).map((tag) => (
                  <button key={tag.id} onClick={() => setSelectedTags((p) => [...p, tag.id])} className="block w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-600 hover:bg-zinc-50">+ {tag.name}</button>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={verifiedBadge} onChange={(e) => setVerifiedBadge(e.target.checked)} className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm text-zinc-700">✅ Badge terverifikasi</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
