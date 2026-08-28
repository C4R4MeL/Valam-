'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import {
  Plus, Search, Filter, BookOpen, Eye, Heart, Edit3, Trash2,
  ChevronLeft, ChevronRight, BarChart3,
} from 'lucide-react';
import { getAllContent, deleteContent } from '@/lib/valam-insights/insights-api';
import { getContentTypeLabel, getStatusInfo, formatDate } from '@/lib/valam-insights/utils';
import type { InsightContentWithAuthor, ContentStatus, ContentType } from '@/lib/valam-insights/types';

const STATUS_FILTERS: { key: ContentStatus | null; label: string }[] = [
  { key: null, label: 'Semua' },
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Published' },
  { key: 'unpublished', label: 'Unpublished' },
];

export default function AdminInsightsPage() {
  const [content, setContent] = useState<InsightContentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ContentStatus | null>(null);
  const [typeFilter, setTypeFilter] = useState<ContentType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const result = await getAllContent({
        status: statusFilter || undefined,
        contentType: typeFilter || undefined,
        page,
        pageSize: 15,
      });
      setContent(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to fetch content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [page, statusFilter, typeFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus konten ini? Aksi tidak dapat dibatalkan.')) return;
    setDeleting(id);
    try {
      await deleteContent(id);
      await fetchContent();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeleting(null);
    }
  };

  // Filter by search locally
  const filtered = searchQuery
    ? content.filter(
        (c) =>
          c.title_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.title_en?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : content;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            Valam Insights
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Kelola artikel, panduan, dan cerita koperasi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/insights/market-prices"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium hover:bg-amber-100 transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            Harga Pasar
          </Link>
          <Link
            href="/dashboard/admin/insights/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 text-white text-sm font-medium hover:bg-emerald-700 transition-all shadow-md shadow-emerald-900/10"
          >
            <Plus className="w-4 h-4" />
            Buat Konten
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Konten', value: total, color: 'text-zinc-900' },
          {
            label: 'Published',
            value: content.filter((c) => c.status === 'published').length,
            color: 'text-emerald-700',
          },
          {
            label: 'Draft',
            value: content.filter((c) => c.status === 'draft').length,
            color: 'text-amber-600',
          },
          {
            label: 'Unpublished',
            value: content.filter((c) => c.status === 'unpublished').length,
            color: 'text-zinc-500',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm"
          >
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              {stat.label}
            </p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf.key || 'all'}
              onClick={() => {
                setStatusFilter(sf.key);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                statusFilter === sf.key
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-zinc-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-12 h-12 text-zinc-300 mb-4" />
            <p className="text-zinc-500 font-medium">Belum ada konten</p>
            <p className="text-sm text-zinc-400 mt-1">
              Klik &ldquo;Buat Konten&rdquo; untuk memulai
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60">
                  <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">
                    Judul
                  </th>
                  <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-4 py-3">
                    Tipe
                  </th>
                  <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-4 py-3">
                    Penulis
                  </th>
                  <th className="text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider px-4 py-3">
                    <Eye className="w-3.5 h-3.5 mx-auto" />
                  </th>
                  <th className="text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider px-4 py-3">
                    <Heart className="w-3.5 h-3.5 mx-auto" />
                  </th>
                  <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-4 py-3">
                    Updated
                  </th>
                  <th className="text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((item) => {
                  const statusInfo = getStatusInfo(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {item.cover_image_url ? (
                            <img
                              src={item.cover_image_url}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-4 h-4 text-zinc-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-800 truncate max-w-[250px]">
                              {item.title_id}
                            </p>
                            <p className="text-xs text-zinc-400 truncate max-w-[250px]">
                              /{item.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-medium text-zinc-600">
                          {getContentTypeLabel(item.content_type)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${statusInfo.colorClass}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-zinc-600">
                          {item.insights_authors?.name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs text-zinc-500">{item.view_count}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs text-zinc-500">{item.like_count}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-zinc-400">
                          {formatDate(item.updated_at)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/insights/${item.slug}`}
                            className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/dashboard/admin/insights/${item.id}/edit`}
                            className="p-2 rounded-lg hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                            className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-400">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
