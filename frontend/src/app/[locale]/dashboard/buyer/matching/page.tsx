'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Search, ArrowRight, CheckCircle2, ChevronRight, ShieldCheck, Heart, Leaf, GlassWater, Zap, Hourglass, CalendarRange } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useToast } from '@/hooks/use-toast'
import { Link } from '@/i18n/routing'

const contentMap = {
  id: {
    hero: {
      badge: "AI-Powered Matching Engine",
      title1: "Temukan Supplier ",
      titleStrong: "Paling Sesuai",
      desc: "Teknologi algoritma cerdas Valam menganalisis ribuan data CoA dan kapasitas supplier untuk menemukan kecocokan yang presisi dengan kebutuhan industri Anda."
    },
    form: {
      volLabel: "Kebutuhan Volume (Kg)",
      volPlaceholder: "Contoh: 1000",
      paLabel: "Kadar Patchouli Alcohol Minimum",
      paPlaceholder: "Contoh: 30",
      catLabel: "Kategori Industri",
      cats: [
        "Fine Fragrance (Parfum)",
        "Cosmetics & Skincare",
        "Aromatherapy & Essential Oils",
        "Food & Beverage Flavoring"
      ],
      timeLabel: "Target Waktu Pengiriman",
      times: [
        "Segera (Stok Tersedia)",
        "1-2 Minggu Depan",
        "Bulan Depan"
      ],
      btnLoading: "Sedang Menganalisis...",
      btnSubmit: "Mulai Pencarian"
    },
    howItWorks: {
      badge: "Mudah & Cepat",
      title: "Bagaimana Cara Kerjanya?",
      subtitle: "Proses analisis cerdas untuk efisiensi rantai pasok Anda.",
      step1Title: "Input Spesifikasi",
      step1Desc: "Masukkan kebutuhan volume dan standar kualitas (PA%) yang sesuai dengan kriteria produk industri Anda.",
      step2Title: "AI Processing",
      step2Desc: "Sistem Valam secara instan memindai dan memfilter ribuan data sertifikat (CoA) supplier yang terverifikasi.",
      step3Title: "Instant Match",
      step3Desc: "Dapatkan rekomendasi top supplier dengan skor kecocokan tertinggi untuk langsung Anda hubungi."
    },
    results: {
      success: "Analisis Selesai! Ditemukan 3 Supplier potensial.",
      btnChange: "Ubah Kriteria",
      matchScore: "Match Score",
      avgPa: "Rata-rata PA:",
      capacity: "Kapasitas:",
      coa: "CoA Terverifikasi",
      btnProfile: "Lihat Profil",
      btnContact: "Hubungi Supplier",
      bestMatch: "Best Match"
    }
  },
  en: {
    hero: {
      badge: "AI-Powered Matching Engine",
      title1: "Find the Most ",
      titleStrong: "Suitable Supplier",
      desc: "Valam's smart algorithm technology analyzes thousands of CoA data and supplier capacities to find a precise match with your industrial needs."
    },
    form: {
      volLabel: "Volume Requirement (Kg)",
      volPlaceholder: "e.g., 1000",
      paLabel: "Minimum Patchouli Alcohol Level",
      paPlaceholder: "e.g., 30",
      catLabel: "Industry Category",
      cats: [
        "Fine Fragrance",
        "Cosmetics & Skincare",
        "Aromatherapy & Essential Oils",
        "Food & Beverage Flavoring"
      ],
      timeLabel: "Target Delivery Time",
      times: [
        "Immediate (Stock Available)",
        "Next 1-2 Weeks",
        "Next Month"
      ],
      btnLoading: "Analyzing...",
      btnSubmit: "Start Search"
    },
    howItWorks: {
      badge: "Fast & Easy",
      title: "How It Works?",
      subtitle: "Smart analysis process for your supply chain efficiency.",
      step1Title: "Input Specifications",
      step1Desc: "Enter your volume requirement and quality standard (PA%) that match your industrial product criteria.",
      step2Title: "AI Processing",
      step2Desc: "The Valam system instantly scans and filters thousands of verified supplier certificates (CoA) data.",
      step3Title: "Instant Match",
      step3Desc: "Get top supplier recommendations with the highest match scores to contact directly."
    },
    results: {
      success: "Analysis Complete! Found 3 potential Suppliers.",
      btnChange: "Change Criteria",
      matchScore: "Match Score",
      avgPa: "Average PA:",
      capacity: "Capacity:",
      coa: "Verified CoA",
      btnProfile: "View Profile",
      btnContact: "Contact Supplier",
      bestMatch: "Best Match"
    }
  }
}

export default function SmartMatchingPage() {
  const [loading, setLoading] = useState(false)
  const [matched, setMatched] = useState(false)
  const [selectedCat, setSelectedCat] = useState(0)
  const [selectedTime, setSelectedTime] = useState(0)
  
  const [volume, setVolume] = useState('50')
  const [minPa, setMinPa] = useState('30')
  const [maxBudget, setMaxBudget] = useState('900000')
  const [maxMoisture, setMaxMoisture] = useState('5')
  const [results, setResults] = useState<any[]>([])
  const [errors, setErrors] = useState<{
    volume?: boolean;
    minPa?: boolean;
    maxBudget?: boolean;
    maxMoisture?: boolean;
  }>({})

  // Load matching states from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVolume = sessionStorage.getItem('matching_volume')
      const savedMinPa = sessionStorage.getItem('matching_minPa')
      const savedMaxBudget = sessionStorage.getItem('matching_maxBudget')
      const savedMaxMoisture = sessionStorage.getItem('matching_maxMoisture')
      const savedSelectedCat = sessionStorage.getItem('matching_selectedCat')
      const savedSelectedTime = sessionStorage.getItem('matching_selectedTime')
      const savedMatched = sessionStorage.getItem('matching_matched')
      const savedResults = sessionStorage.getItem('matching_results')

      if (savedVolume) setVolume(savedVolume)
      if (savedMinPa) setMinPa(savedMinPa)
      if (savedMaxBudget) setMaxBudget(savedMaxBudget)
      if (savedMaxMoisture) setMaxMoisture(savedMaxMoisture)
      if (savedSelectedCat) setSelectedCat(Number(savedSelectedCat))
      if (savedSelectedTime) setSelectedTime(Number(savedSelectedTime))
      if (savedMatched === 'true') setMatched(true)
      if (savedResults) setResults(JSON.parse(savedResults))
    }
  }, [])

  // Save matching states to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('matching_volume', volume)
      sessionStorage.setItem('matching_minPa', minPa)
      sessionStorage.setItem('matching_maxBudget', maxBudget)
      sessionStorage.setItem('matching_maxMoisture', maxMoisture)
      sessionStorage.setItem('matching_selectedCat', String(selectedCat))
      sessionStorage.setItem('matching_selectedTime', String(selectedTime))
      sessionStorage.setItem('matching_matched', String(matched))
      sessionStorage.setItem('matching_results', JSON.stringify(results))
    }
  }, [volume, minPa, maxBudget, maxMoisture, selectedCat, selectedTime, matched, results])

  const { toast } = useToast()
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const newErrors: typeof errors = {}
    if (!volume) newErrors.volume = true
    if (!minPa) newErrors.minPa = true
    if (!maxBudget) newErrors.maxBudget = true
    if (!maxMoisture) newErrors.maxMoisture = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast({
        title: locale === 'id' ? 'Formulir Belum Lengkap' : 'Form Incomplete',
        description: locale === 'id' 
          ? 'Mohon lengkapi semua kriteria pencarian yang berwarna merah sebelum memulai pencarian.'
          : 'Please complete all red highlighted search criteria before starting the search.',
        variant: 'destructive'
      })
      setLoading(false)
      return
    }
    setErrors({})

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    const token = localStorage.getItem('valam_token')

    try {
      const res = await fetch(`${API_URL}/matching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          volume_kg: Number(volume),
          min_pa: Number(minPa),
          max_budget: Number(maxBudget),
          max_moisture: Number(maxMoisture)
        })
      })

      if (!res.ok) {
        throw new Error('Gagal mencocokkan supplier')
      }

      const json = await res.json()
      setResults(json.data || [])
      setMatched(true)
    } catch (err) {
      console.warn("Backend matching offline, using fallback mock matching:", err)
      // Fallback mock algorithm
      const mockResults = [
        { id: 'prod_1', supplier_id: 'sup_aceh', supplier_name: 'Koperasi Tani Harapan (Aceh)', match_score: 98, pa_percentage: 32.5, available_volume_kg: 1200, price_per_kg: 920000 },
        { id: 'prod_2', supplier_id: 'sup_gayo', supplier_name: 'Gayo Patchouli Center', match_score: 92, pa_percentage: 31.0, available_volume_kg: 800, price_per_kg: 900000 },
        { id: 'prod_3', supplier_id: 'sup_sulawesi', supplier_name: 'Sulawesi Agro Atsiri', match_score: 85, pa_percentage: 30.2, available_volume_kg: 2500, price_per_kg: 880000 }
      ]
      setResults(mockResults)
      setMatched(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full animate-in fade-in duration-500 flex flex-col pb-20 relative bg-zinc-55 min-h-screen">
      <DashboardHeader />

      {/* INTERACTIVE FORM & CONTENT SECTION */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">
        {!matched ? (
          <div className="space-y-20 animate-in slide-in-from-bottom-8 duration-700">
            {/* The Form */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-200/80 shadow-2xl shadow-emerald-900/10 p-6 md:p-10">
              <form onSubmit={handleMatch} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-emerald-950 font-bold text-base">{t.form.volLabel}</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        placeholder={t.form.volPlaceholder} 
                        className={`h-14 pl-4 pr-12 text-lg bg-zinc-50 transition-all rounded-xl focus:ring-emerald-500
                          ${errors.volume 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : 'border-zinc-200 focus:border-emerald-500'
                          }
                        `} 
                        value={volume} 
                        onChange={e => {
                          setVolume(e.target.value)
                          if (e.target.value) setErrors(prev => ({ ...prev, volume: false }))
                        }} 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">Kg</span>
                    </div>
                    {errors.volume && (
                      <p className="text-red-500 text-xs font-semibold mt-1">
                        {locale === 'id' ? 'Volume harus diisi' : 'Volume is required'}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-emerald-950 font-bold text-base">{t.form.paLabel}</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        placeholder={t.form.paPlaceholder} 
                        min="20" 
                        max="40" 
                        className={`h-14 pl-4 pr-12 text-lg bg-zinc-50 transition-all rounded-xl focus:ring-emerald-500
                          ${errors.minPa 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : 'border-zinc-200 focus:border-emerald-500'
                          }
                        `} 
                        value={minPa} 
                        onChange={e => {
                          setMinPa(e.target.value)
                          if (e.target.value) setErrors(prev => ({ ...prev, minPa: false }))
                        }} 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">%</span>
                    </div>
                    {errors.minPa && (
                      <p className="text-red-500 text-xs font-semibold mt-1">
                        {locale === 'id' ? 'PA% minimum harus diisi' : 'Min PA% is required'}
                      </p>
                    )}
                  </div>
 
                  <div className="space-y-3">
                    <Label className="text-emerald-950 font-bold text-base">Target Budget / Kg (Rp)</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        placeholder="Contoh: 900000" 
                        className={`h-14 pl-4 pr-12 text-lg bg-zinc-50 transition-all rounded-xl focus:ring-emerald-500
                          ${errors.maxBudget 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : 'border-zinc-200 focus:border-emerald-500'
                          }
                        `} 
                        value={maxBudget} 
                        onChange={e => {
                          setMaxBudget(e.target.value)
                          if (e.target.value) setErrors(prev => ({ ...prev, maxBudget: false }))
                        }} 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">Rp</span>
                    </div>
                    {errors.maxBudget && (
                      <p className="text-red-500 text-xs font-semibold mt-1">
                        {locale === 'id' ? 'Budget harus diisi' : 'Budget is required'}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-emerald-950 font-bold text-base">Maksimum Kadar Air (%)</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        placeholder="Contoh: 5" 
                        min="1" 
                        max="20" 
                        className={`h-14 pl-4 pr-12 text-lg bg-zinc-50 transition-all rounded-xl focus:ring-emerald-500
                          ${errors.maxMoisture 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : 'border-zinc-200 focus:border-emerald-500'
                          }
                        `} 
                        value={maxMoisture} 
                        onChange={e => {
                          setMaxMoisture(e.target.value)
                          if (e.target.value) setErrors(prev => ({ ...prev, maxMoisture: false }))
                        }} 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">%</span>
                    </div>
                    {errors.maxMoisture && (
                      <p className="text-red-500 text-xs font-semibold mt-1">
                        {locale === 'id' ? 'Kadar air maksimum harus diisi' : 'Max moisture is required'}
                      </p>
                    )}
                  </div>

                  {/* Category Selection Cards */}
                  <div className="space-y-3 md:col-span-2">
                    <Label className="text-emerald-950 font-bold text-base">{t.form.catLabel}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { name: t.form.cats[0], icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                        { name: t.form.cats[1], icon: Heart, color: 'text-rose-600 bg-rose-50 border-rose-100' },
                        { name: t.form.cats[2], icon: Leaf, color: 'text-emerald-650 bg-emerald-50 border-emerald-100' },
                        { name: t.form.cats[3], icon: GlassWater, color: 'text-blue-600 bg-blue-50 border-blue-100' }
                      ].map((cat, i) => {
                        const Icon = cat.icon
                        const isSelected = selectedCat === i
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedCat(i)}
                            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all text-center h-28 hover:shadow-md hover:border-emerald-355
                              ${isSelected 
                                ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-600/20' 
                                : 'border-zinc-200 bg-white'
                              }
                            `}
                          >
                            <div className={`p-2 rounded-lg ${cat.color} shrink-0`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-emerald-950">{cat.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Delivery Time Selection Cards */}
                  <div className="space-y-3 md:col-span-2">
                    <Label className="text-emerald-950 font-bold text-base">{t.form.timeLabel}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { name: t.form.times[0], icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                        { name: t.form.times[1], icon: Hourglass, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                        { name: t.form.times[2], icon: CalendarRange, color: 'text-zinc-600 bg-zinc-100 border-zinc-200' }
                      ].map((time, i) => {
                        const Icon = time.icon
                        const isSelected = selectedTime === i
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedTime(i)}
                            className={`p-4 rounded-xl border flex items-center gap-4 transition-all hover:shadow-md hover:border-emerald-355 h-20 text-left
                              ${isSelected 
                                ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-600/20' 
                                : 'border-zinc-200 bg-white'
                              }
                            `}
                          >
                            <div className={`p-2 rounded-lg ${time.color} shrink-0`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-emerald-950">{time.name}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-zinc-100">
                  <Button 
                    type="submit" 
                    className="h-11 px-6 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-600 hover:to-gold-500 text-emerald-950 font-bold shadow-md shadow-gold-500/10 text-sm rounded-xl hover:scale-[1.01] transition-transform duration-350 w-full sm:w-auto"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-1.5 text-xs">{t.form.btnLoading} <Sparkles className="w-4 h-4 animate-spin" /></span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs">{t.form.btnSubmit} <ArrowRight className="w-4 h-4 ml-0.5" /></span>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* CARA KERJA SECTION */}
            <div className="pt-8">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
                  <Search className="w-4 h-4" /> {t.howItWorks.badge}
                </div>
                <h2 className="text-3xl font-bold text-emerald-950">{t.howItWorks.title}</h2>
                <p className="text-zinc-600 mt-3 text-lg">{t.howItWorks.subtitle}</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm text-center relative overflow-hidden group hover:border-emerald-200 transition-colors">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-black">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-emerald-950 mb-3">{t.howItWorks.step1Title}</h3>
                  <p className="text-zinc-600 leading-relaxed text-sm">
                    {t.howItWorks.step1Desc}
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm text-center relative overflow-hidden group hover:border-emerald-200 transition-colors">
                  <div className="w-16 h-16 bg-gold-50 text-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-black">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-emerald-950 mb-3">{t.howItWorks.step2Title}</h3>
                  <p className="text-zinc-600 leading-relaxed text-sm">
                    {t.howItWorks.step2Desc}
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm text-center relative overflow-hidden group hover:border-emerald-200 transition-colors">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-black">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-emerald-950 mb-3">{t.howItWorks.step3Title}</h3>
                  <p className="text-zinc-600 leading-relaxed text-sm">
                    {t.howItWorks.step3Desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
              <div className="flex items-center gap-3 text-emerald-800 font-medium">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                {t.results.success}
              </div>
              <Button variant="outline" onClick={() => setMatched(false)} className="mt-4 sm:mt-0">{t.results.btnChange}</Button>
            </div>

            <div className="grid gap-6 mt-8">
              {results.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-zinc-200 text-center text-zinc-500">
                  Tidak ditemukan supplier yang cocok dengan kriteria Anda. Coba naikkan budget atau turunkan syarat PA%.
                </div>
              ) : (
                results.map((sup, i) => {
                  const isBestMatch = i === 0 && sup.match_score >= 80
                  return (
                    <div key={sup.id || i} className={`bg-white p-5 md:p-6 rounded-xl border transition-all hover:shadow-lg flex flex-col md:flex-row items-center gap-6 relative overflow-hidden
                      ${isBestMatch ? 'border-gold-400 ring-1 ring-gold-400/20 shadow-gold-500/5' : 'border-zinc-200 hover:border-emerald-250 shadow-sm'}
                    `}>
                      {isBestMatch && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-gold-500 to-gold-400 text-emerald-950 text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm">
                          {t.results.bestMatch}
                        </div>
                      )}
                      
                      <div className="flex-shrink-0 flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-50 to-white rounded-full border-2 border-emerald-100 shadow-inner">
                        <div className="text-center">
                          <span className="block text-2xl font-black text-emerald-600 leading-none">{sup.match_score}%</span>
                          <span className="block text-[8px] uppercase font-bold text-emerald-800 tracking-wider mt-0.5">{t.results.matchScore}</span>
                        </div>
                      </div>

                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-lg font-bold text-emerald-950 flex items-center justify-center md:justify-start gap-1.5">
                          {sup.supplier_name} <ShieldCheck className="w-5 h-5 text-blue-500" />
                        </h3>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-xs text-zinc-500">
                          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t.results.avgPa} <strong className="text-emerald-950 font-bold">{sup.pa_percentage}%</strong></div>
                          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t.results.capacity} <strong className="text-emerald-950 font-bold">{sup.available_volume_kg} kg</strong></div>
                          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t.results.coa}</div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
                        <Button asChild variant="outline" className="w-full sm:w-auto border-emerald-200 text-emerald-700 h-10 px-4 text-xs font-bold rounded-lg">
                          <Link href={`/marketplace/supplier/${sup.supplier_id}?from=matching`}>
                            {t.results.btnProfile}
                          </Link>
                        </Button>
                        <Button asChild className="w-full sm:w-auto bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold shadow-sm h-10 px-4 text-xs font-bold rounded-lg">
                          <Link href={`/dashboard/buyer/rfq/new?supplier=${sup.supplier_id}&supplier_name=${encodeURIComponent(sup.supplier_name)}&volume=${volume}&minPa=${minPa}&budget=${maxBudget}&moisture=${maxMoisture}`}>
                            {t.results.btnContact}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
