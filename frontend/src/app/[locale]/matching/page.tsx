'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CriteriaPanel } from '@/components/smart-matching/CriteriaPanel'
import { ResultPanel } from '@/components/smart-matching/ResultPanel'
import { Sparkles, Check, ChevronRight } from 'lucide-react'

interface Preset {
  id: string
  title: string
  desc: string
  icon: string
  criteria: {
    volume_kg: number
    max_budget: number
    min_pa: number
    max_moisture: number
  }
}

const PRESETS: Record<'id' | 'en', Preset[]> = {
  id: [
    {
      id: 'export_std',
      title: 'Standar Ekspor Global',
      desc: 'Paling diminati untuk pasar ekspor Eropa, Amerika & Asia.',
      icon: '🌟',
      criteria: { volume_kg: 100, max_budget: 900000, min_pa: 30, max_moisture: 3 }
    },
    {
      id: 'super_perfume',
      title: 'Grade Super / Parfum',
      desc: 'Aroma pekat & kemurnian tertinggi untuk industri wewangian.',
      icon: '💎',
      criteria: { volume_kg: 100, max_budget: 1000000, min_pa: 32, max_moisture: 2 }
    },
    {
      id: 'bulk_industry',
      title: 'Kebutuhan Pabrik / Skala Besar',
      desc: 'Volume tinggi & efisiensi biaya untuk manufaktur dan sabun/kosmetik.',
      icon: '🏭',
      criteria: { volume_kg: 300, max_budget: 820000, min_pa: 28, max_moisture: 4 }
    },
    {
      id: 'ready_all',
      title: 'Semua Stok / Siap Kirim',
      desc: 'Jelajahi seluruh batch aktif dari koperasi nilam terverifikasi.',
      icon: '⚡',
      criteria: { volume_kg: 50, max_budget: 950000, min_pa: 28, max_moisture: 5 }
    }
  ],
  en: [
    {
      id: 'export_std',
      title: 'Global Export Standard',
      desc: 'Most popular for European, American & Asian export markets.',
      icon: '🌟',
      criteria: { volume_kg: 100, max_budget: 900000, min_pa: 30, max_moisture: 3 }
    },
    {
      id: 'super_perfume',
      title: 'Super Grade / Perfume',
      desc: 'Highest aroma density and maximum purity for fragrance makers.',
      icon: '💎',
      criteria: { volume_kg: 100, max_budget: 1000000, min_pa: 32, max_moisture: 2 }
    },
    {
      id: 'bulk_industry',
      title: 'Bulk Manufacturing Demand',
      desc: 'High volume & cost efficiency for cosmetics, care products and soap.',
      icon: '🏭',
      criteria: { volume_kg: 300, max_budget: 820000, min_pa: 28, max_moisture: 4 }
    },
    {
      id: 'ready_all',
      title: 'All Available Batches',
      desc: 'Explore all active batches ready for dispatch from certified cooperatives.',
      icon: '⚡',
      criteria: { volume_kg: 50, max_budget: 950000, min_pa: 28, max_moisture: 5 }
    }
  ]
}

const contentMap = {
  id: {
    badge: "AI-POWERED MATCHING ENGINE",
    title: "Smart Matching Minyak Nilam",
    subtitle: "Pilih template kebutuhan atau atur kriteria kualitas untuk menemukan pasokan minyak nilam terverifikasi yang paling sesuai.",
    presetTitle: "Pilihan Cepat Kebutuhan Industri",
    presetSubtitle: "Klik salah satu template di bawah untuk melihat rekomendasi supplier dalam 1 klik:",
    form: {
      title: "Kriteria Kebutuhan",
      volume: "Target Volume",
      budget: "Anggaran Maks / Kg",
      minPa: "Minimal Kadar PA%",
      maxMoisture: "Maksimal Kadar Air%",
      btnSubmit: "Perbarui Rekomendasi",
      btnLoading: "Mengkalkulasi Rekomendasi..."
    },
    results: {
      title: "Peringkat Rekomendasi Supplier",
      subtitle: "Diurutkan berdasarkan skor kecocokan tertinggi",
      readyTitle: "Siap Melakukan Pencocokan",
      readyDesc: "Pilih salah satu template di atas atau klik tombol \"Perbarui Rekomendasi\" untuk melihat hasil.",
      emptyTitle: "Spesifikasi Terlalu Ketat",
      emptyDesc: "Maaf, tidak ada batch terdaftar yang saat ini memenuhi seluruh kriteria di atas. Silakan naikkan batas Anggaran atau longgarkan minimal kadar PA%.",
      matchScore: "Match Score",
      stock: "Stok",
      pa: "PA",
      moisture: "Air",
      priceLabel: "Harga Penawaran",
      btnDetail: "Lihat Detail",
      btnRfq: "Ajukan RFQ",
      bestMatch: "Rekomendasi Terbaik"
    }
  },
  en: {
    badge: "AI-POWERED MATCHING ENGINE",
    title: "Patchouli Oil Smart Matching",
    subtitle: "Select a quick industry template or fine-tune quality criteria to instantly find the best verified patchouli oil batches.",
    presetTitle: "Quick Industry Presets",
    presetSubtitle: "Click any preset below to view matched suppliers in one click:",
    form: {
      title: "Requirement Criteria",
      volume: "Target Volume",
      budget: "Max Budget / Kg",
      minPa: "Min PA% Level",
      maxMoisture: "Max Moisture Level",
      btnSubmit: "Update Recommendations",
      btnLoading: "Calculating Recommendations..."
    },
    results: {
      title: "Recommended Supplier Rankings",
      subtitle: "Ranked by highest matching score",
      readyTitle: "Ready to Match",
      readyDesc: "Choose any template above or click \"Update Recommendations\" to view matched batches.",
      emptyTitle: "Specifications Too Strict",
      emptyDesc: "Sorry, no registered batches meet these exact criteria. Try increasing the max budget or adjusting the minimum PA% requirement.",
      matchScore: "Match Score",
      stock: "Stock",
      pa: "PA",
      moisture: "Moisture",
      priceLabel: "Offered Price",
      btnDetail: "View Detail",
      btnRfq: "Submit RFQ",
      bestMatch: "Best Recommendation"
    }
  }
}

export default function SmartMatchingPage() {
  const { toast } = useToast()
  const locale = useLocale() as 'id' | 'en'
  const isId = locale === 'id'
  const t = contentMap[locale] || contentMap.id
  const presets = PRESETS[locale] || PRESETS.id
  
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [activePresetId, setActivePresetId] = useState<string>('export_std')
  
  const defaultCriteria = presets[0].criteria
  const [criteria, setCriteria] = useState(defaultCriteria)

  // Initialize and run matching on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const qVolume = urlParams.get('volume');
      const qMinPa = urlParams.get('min_pa');
      const qMaxBudget = urlParams.get('max_budget');
      const qMaxMoisture = urlParams.get('max_moisture');

      if (qVolume || qMinPa || qMaxBudget || qMaxMoisture) {
        const loadedCriteria = {
          volume_kg: qVolume ? Number(qVolume) : 100,
          max_budget: qMaxBudget ? Number(qMaxBudget) : 900000,
          min_pa: qMinPa ? Number(qMinPa) : 30,
          max_moisture: qMaxMoisture ? Number(qMaxMoisture) : 3
        };
        setCriteria(loadedCriteria);
        setActivePresetId('');
        handleSearch(loadedCriteria);
        return;
      }

      const savedResults = sessionStorage.getItem('pub_matching_results')
      if (savedResults && savedResults !== '[]') {
        try {
          const parsed = JSON.parse(savedResults)
          setResults(parsed)
          setHasSearched(true)
          return
        } catch (e) {
          // ignore error
        }
      }

      // If no search was run yet, immediately run matching with standard preset so user sees instant results
      handleSearch(defaultCriteria)
    }
  }, [])

  // Persist results state
  useEffect(() => {
    if (typeof window !== 'undefined' && results.length > 0) {
      sessionStorage.setItem('pub_matching_results', JSON.stringify(results))
    }
  }, [results])

  const applyPreset = (preset: Preset) => {
    setActivePresetId(preset.id)
    setCriteria(preset.criteria)
    handleSearch(preset.criteria)
  }

  const handleReset = () => {
    applyPreset(presets[0])
  }

  const handleRfqClick = (e: React.MouseEvent) => {
    const role = localStorage.getItem('valam_role')
    if (role !== 'buyer') {
      e.preventDefault()
      toast({
        title: locale === 'id' ? 'Login Dibutuhkan' : 'Login Required',
        description: locale === 'id' 
          ? 'Silakan masuk ke akun Buyer (Pembeli) untuk mengajukan RFQ. Anda akan diarahkan ke halaman login...'
          : 'Please log in to a Buyer account to submit an RFQ. Redirecting you to login page...',
        variant: 'destructive'
      })
      setTimeout(() => {
        window.location.href = `/${locale}/login?redirect=/matching`
      }, 1500)
    }
  }

  const handleSearch = async (overrideCriteria?: typeof criteria) => {
    const activeCriteria = (overrideCriteria && typeof overrideCriteria === 'object' && 'volume_kg' in overrideCriteria) 
      ? overrideCriteria 
      : criteria;
    setLoading(true)
    try {
      const token = localStorage.getItem('valam_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'}/matching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          volume_kg: activeCriteria.volume_kg,
          min_pa: activeCriteria.min_pa,
          max_budget: activeCriteria.max_budget,
          max_moisture: activeCriteria.max_moisture
        })
      })

      if (!res.ok) throw new Error('Gagal memuat rekomendasi')
      
      const json = await res.json()
      setResults(json.data || [])
      setHasSearched(true)
    } catch (err: any) {
      console.warn("Matching endpoint failed, calculating from verified database products:", err)
      try {
        const pRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'}/products?status=VERIFIED`)
        if (pRes.ok) {
          const pData = await pRes.json()
          const dbProducts = pData.data || []
          const calculated = dbProducts
            .filter((p: any) => p.status === 'VERIFIED' && p.available_volume_kg > 0)
            .map((item: any) => {
              const pa = item.pa_percentage || 0
              const moisture = item.moisture || 0
              const price = item.price_per_kg || 0
              const vol = item.available_volume_kg || 0

              const volDiffRatio = Math.abs(vol - activeCriteria.volume_kg) / Math.max(activeCriteria.volume_kg, 1)
              const volScore = Math.max(0, 100 - volDiffRatio * 50)

              let budgetScore = 100
              if (price > activeCriteria.max_budget) {
                const budgetOverRatio = (price - activeCriteria.max_budget) / Math.max(activeCriteria.max_budget, 1)
                budgetScore = Math.max(0, 100 - budgetOverRatio * 150)
              }

              let paScore = 100
              if (pa < activeCriteria.min_pa) {
                const paUnderRatio = (activeCriteria.min_pa - pa) / Math.max(activeCriteria.min_pa, 1)
                paScore = Math.max(0, 100 - paUnderRatio * 200)
              }

              let moistureScore = 100
              if (moisture > activeCriteria.max_moisture) {
                const moistureOverRatio = (moisture - activeCriteria.max_moisture) / Math.max(activeCriteria.max_moisture, 1)
                moistureScore = Math.max(0, 100 - moistureOverRatio * 100)
              }

              const score = (volScore * 0.25) + (budgetScore * 0.25) + (paScore * 0.35) + (moistureScore * 0.15)
              return {
                ...item,
                match_score: Math.round(score)
              }
            })

          calculated.sort((a: any, b: any) => b.match_score - a.match_score)
          setResults(calculated)
          setHasSearched(true)
          return
        }
      } catch (e) {
        console.error("Failed to query verified products for matching:", e)
      }
      setResults([])
      setHasSearched(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col selection:bg-[#1A4D2E]/10 selection:text-[#1A4D2E] font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6">
        
        {/* ─── DIRECT PAGE HEADER ──────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#1A4D2E] text-xs font-bold border border-emerald-200 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.badge}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900 tracking-tight">
              {t.title}
            </h1>
            <p className="text-zinc-500 text-sm mt-1 max-w-2xl">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* ─── QUICK INDUSTRY PRESET CARDS ─────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400">
              {t.presetTitle}
            </h2>
            <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">
              {t.presetSubtitle}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {presets.map((preset) => {
              const isSelected = activePresetId === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/70 border-[#1A4D2E] ring-2 ring-[#1A4D2E]/20 shadow-sm'
                      : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-2xl">{preset.icon}</span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[10px] font-black bg-[#1A4D2E] text-white px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          <span>{isId ? 'Aktif' : 'Active'}</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-zinc-900 leading-snug mb-1">
                      {preset.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      {preset.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-150 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                    <span>PA ≥ {preset.criteria.min_pa}%</span>
                    <span>Air ≤ {preset.criteria.max_moisture}%</span>
                    <span>{preset.criteria.volume_kg} Kg</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── MAIN TOOL: CRITERIA (LEFT) + RESULTS (RIGHT) ─────────────── */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Criteria Panel */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <CriteriaPanel
              criteria={criteria}
              onCriteriaChange={(newCriteria) => {
                setActivePresetId('')
                setCriteria(newCriteria)
              }}
              onSubmit={() => handleSearch()}
              onReset={handleReset}
              loading={loading}
              locale={locale}
              translations={t.form}
            />
          </div>

          {/* Right Column: Matched Results */}
          <div className="lg:col-span-8 min-h-[500px]">
            <ResultPanel
              hasSearched={hasSearched}
              loading={loading}
              results={results}
              locale={locale}
              onRfqClick={handleRfqClick}
              criteria={criteria}
              translations={t.results}
            />
          </div>

        </div>

      </main>

      <Footer />
    </div>
  )
}
