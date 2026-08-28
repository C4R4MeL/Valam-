'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  ArrowLeft, Save, Send, Image as ImageIcon, Plus, X, Tag, Globe, FileText,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import {
  createContent,
  getAllTags,
  findOrCreateTag,
  uploadInsightImage,
} from '@/lib/valam-insights/insights-api';
import { generateSlug } from '@/lib/valam-insights/utils';
import type {
  ContentType,
  ContentStatus,
  AuthorType,
  InsightTag,
  ContentFormData,
} from '@/lib/valam-insights/types';

// Lazy load the markdown editor (heavy component)
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'artikel', label: 'Artikel' },
  { value: 'panduan', label: 'Panduan' },
  { value: 'cerita_koperasi', label: 'Cerita Koperasi' },
];

export default function CreateInsightPage() {
  const router = useRouter();
  const locale = useLocale();

  // Form state
  const [contentType, setContentType] = useState<ContentType>('artikel');
  const [titleId, setTitleId] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [excerptId, setExcerptId] = useState('');
  const [excerptEn, setExcerptEn] = useState('');
  const [bodyId, setBodyId] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [verifiedBadge, setVerifiedBadge] = useState(false);
  const [activeBodyTab, setActiveBodyTab] = useState<'id' | 'en'>('id');

  // Tags
  const [allTags, setAllTags] = useState<InsightTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');

  // CTAs
  const [ctas, setCtas] = useState<{ label_id: string; label_en: string; target_url: string }[]>([]);

  // Images
  const [coverUploading, setCoverUploading] = useState(false);

  // Submit
  const [saving, setSaving] = useState(false);

  // Load tags
  useEffect(() => {
    getAllTags().then(setAllTags).catch(console.error);
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManual && titleId) {
      setSlug(generateSlug(titleId));
    }
  }, [titleId, slugManual]);

  // Cover image upload
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
      alert('Gagal upload gambar. Coba lagi.');
    } finally {
      setCoverUploading(false);
    }
  };

  // Add new tag
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

  // Add CTA
  const handleAddCta = () => {
    setCtas((prev) => [...prev, { label_id: '', label_en: '', target_url: '' }]);
  };

  // Save content
  const handleSave = async (status: ContentStatus) => {
    if (!titleId.trim()) {
      alert('Judul (ID) wajib diisi!');
      return;
    }
    if (!slug.trim()) {
      alert('Slug wajib diisi!');
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

      await createContent(formData);
      router.push(`/${locale}/dashboard/admin/insights`);
    } catch (err: any) {
      console.error('Failed to save:', err);
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

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
            <h1 className="text-xl font-bold text-zinc-900">Buat Konten Baru</h1>
            <p className="text-sm text-zinc-500">
              Buat artikel, panduan, atau cerita koperasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Type */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <label className="block text-sm font-semibold text-zinc-800 mb-3">
              Jenis Konten
            </label>
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
                placeholder="Masukkan judul artikel..."
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-800 mb-2">
                Judul (English)
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Enter article title..."
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-800 mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">/insights/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugManual(true);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300"
                />
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-800">Ringkasan / Excerpt</h3>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Indonesia</label>
              <textarea
                value={excerptId}
                onChange={(e) => setExcerptId(e.target.value)}
                placeholder="Ringkasan singkat untuk SEO dan preview..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">English</label>
              <textarea
                value={excerptEn}
                onChange={(e) => setExcerptEn(e.target.value)}
                placeholder="Brief summary for SEO and preview..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
              />
            </div>
          </div>

          {/* Body (Markdown Editor) */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-800">
                <FileText className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Konten Body (Markdown)
              </h3>
              <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveBodyTab('id')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeBodyTab === 'id'
                      ? 'bg-white text-zinc-800 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  🇮🇩 Indonesia
                </button>
                <button
                  onClick={() => setActiveBodyTab('en')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeBodyTab === 'en'
                      ? 'bg-white text-zinc-800 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            <div data-color-mode="light">
              {activeBodyTab === 'id' ? (
                <MDEditor
                  value={bodyId}
                  onChange={(val) => setBodyId(val || '')}
                  height={400}
                  preview="edit"
                />
              ) : (
                <MDEditor
                  value={bodyEn}
                  onChange={(val) => setBodyEn(val || '')}
                  height={400}
                  preview="edit"
                />
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-800">
                CTA (Call to Action)
              </h3>
              <button
                onClick={handleAddCta}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 text-xs font-medium text-zinc-600 hover:bg-zinc-200 transition-all"
              >
                <Plus className="w-3 h-3" />
                Tambah CTA
              </button>
            </div>

            {ctas.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-4">
                Belum ada CTA. Klik tombol di atas untuk menambahkan.
              </p>
            ) : (
              <div className="space-y-3">
                {ctas.map((cta, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={cta.label_id}
                        onChange={(e) => {
                          const updated = [...ctas];
                          updated[index].label_id = e.target.value;
                          setCtas(updated);
                        }}
                        placeholder="Label (ID)"
                        className="px-3 py-2 rounded-lg border border-zinc-200 text-sm"
                      />
                      <input
                        type="text"
                        value={cta.label_en}
                        onChange={(e) => {
                          const updated = [...ctas];
                          updated[index].label_en = e.target.value;
                          setCtas(updated);
                        }}
                        placeholder="Label (EN)"
                        className="px-3 py-2 rounded-lg border border-zinc-200 text-sm"
                      />
                      <input
                        type="url"
                        value={cta.target_url}
                        onChange={(e) => {
                          const updated = [...ctas];
                          updated[index].target_url = e.target.value;
                          setCtas(updated);
                        }}
                        placeholder="https://..."
                        className="px-3 py-2 rounded-lg border border-zinc-200 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => setCtas((prev) => prev.filter((_, i) => i !== index))}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cover Image */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 className="text-sm font-semibold text-zinc-800 mb-3">
              <ImageIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Cover Image
            </h3>

            {coverImageUrl ? (
              <div className="relative rounded-xl overflow-hidden mb-3">
                <img
                  src={coverImageUrl}
                  alt="Cover"
                  className="w-full aspect-[16/10] object-cover"
                />
                <button
                  onClick={() => setCoverImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 text-center hover:border-emerald-300 hover:bg-emerald-50/30 transition-all">
                  {coverUploading ? (
                    <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-sm text-zinc-500">
                        Klik untuk upload
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        JPG, PNG, WebP (max 5MB)
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 className="text-sm font-semibold text-zinc-800 mb-3">
              <Tag className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Tags
            </h3>

            {/* Selected tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.map((tagId) => {
                const tag = allTags.find((t) => t.id === tagId);
                if (!tag) return null;
                return (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium"
                  >
                    {tag.name}
                    <button
                      onClick={() =>
                        setSelectedTags((prev) => prev.filter((id) => id !== tagId))
                      }
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Add tag */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Tag baru..."
                className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <button
                onClick={handleAddTag}
                className="p-2 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Existing tags dropdown */}
            {allTags.filter((t) => !selectedTags.includes(t.id)).length > 0 && (
              <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
                {allTags
                  .filter((t) => !selectedTags.includes(t.id))
                  .map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTags((prev) => [...prev, tag.id])}
                      className="block w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                      + {tag.name}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-800">Opsi</h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedBadge}
                onChange={(e) => setVerifiedBadge(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-zinc-700">
                ✅ Tampilkan badge terverifikasi
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
