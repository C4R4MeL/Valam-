'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, TrendingUp, History } from 'lucide-react';
import { Link } from '@/i18n/routing';
import {
  getLatestMarketPrices,
  getMarketPriceHistory,
  updateMarketPrice,
} from '@/lib/valam-insights/insights-api';
import { formatPrice, formatDate } from '@/lib/valam-insights/utils';
import type { InsightMarketPrice, InsightMarketPriceHistory } from '@/lib/valam-insights/types';

const gradeInfo: Record<string, { label: string; description: string; color: string }> = {
  A: { label: 'Grade A', description: 'PA ≥ 32%, premium quality', color: 'emerald' },
  B: { label: 'Grade B', description: 'PA 28-32%, standard quality', color: 'blue' },
  C: { label: 'Grade C', description: 'PA < 28%, basic quality', color: 'amber' },
};

export default function MarketPricesPage() {
  const [prices, setPrices] = useState<InsightMarketPrice[]>([]);
  const [history, setHistory] = useState<Record<string, InsightMarketPriceHistory[]>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const priceData = await getLatestMarketPrices();
        setPrices(priceData);

        // Initialize edit values
        const vals: Record<string, string> = {};
        priceData.forEach((p) => {
          vals[p.id] = p.price_per_kg.toString();
        });
        setEditValues(vals);

        // Fetch history for each grade
        const histMap: Record<string, InsightMarketPriceHistory[]> = {};
        for (const p of priceData) {
          const hist = await getMarketPriceHistory(p.grade, 10);
          histMap[p.grade] = hist;
        }
        setHistory(histMap);
      } catch (err) {
        console.error('Failed to load prices:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async (price: InsightMarketPrice) => {
    const newPrice = parseFloat(editValues[price.id] || '0');
    if (isNaN(newPrice) || newPrice <= 0) {
      alert('Harga harus berupa angka positif');
      return;
    }

    setSaving(price.id);
    try {
      const updated = await updateMarketPrice(price.id, newPrice);
      setPrices((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      // Refresh history
      const hist = await getMarketPriceHistory(price.grade, 10);
      setHistory((prev) => ({ ...prev, [price.grade]: hist }));
    } catch (err) {
      console.error('Failed to update price:', err);
      alert('Gagal memperbarui harga');
    } finally {
      setSaving(null);
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
    <div className="p-6 lg:p-8 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/admin/insights"
          className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Harga Pasar Nilam
          </h1>
          <p className="text-sm text-zinc-500">
            Perbarui harga pasar minyak nilam per kg
          </p>
        </div>
      </div>

      {/* Price Cards */}
      <div className="space-y-6">
        {prices.map((price) => {
          const info = gradeInfo[price.grade] || gradeInfo.C;
          const gradeHistory = history[price.grade] || [];

          return (
            <div key={price.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
              {/* Card Header */}
              <div className={`px-6 py-4 bg-${info.color}-50 border-b border-${info.color}-100`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">{info.label}</h2>
                    <p className="text-sm text-zinc-500">{info.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-zinc-900">
                      {formatPrice(price.price_per_kg)}
                    </p>
                    <p className="text-xs text-zinc-400">per kg</p>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div className="px-6 py-5">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Harga baru (IDR per kg)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={editValues[price.id] || ''}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, [price.id]: e.target.value }))
                      }
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <button
                    onClick={() => handleSave(price)}
                    disabled={saving === price.id}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-800 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    {saving === price.id ? 'Menyimpan...' : 'Update'}
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  Terakhir diperbarui: {formatDate(price.updated_at)}
                </p>
              </div>

              {/* Price History */}
              {gradeHistory.length > 1 && (
                <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Riwayat Harga
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    {gradeHistory.slice(0, 5).map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-zinc-500">
                          {formatDate(h.recorded_at)}
                        </span>
                        <span className="font-medium text-zinc-700 font-mono">
                          {formatPrice(h.price_per_kg)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
