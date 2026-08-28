'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { mockProducts } from '@/lib/mock-data'

// New Smart Matching Redesigned Components
import { SmartMatchingHero } from '@/components/smart-matching/SmartMatchingHero'
import { HowItWorksSection } from '@/components/smart-matching/HowItWorksSection'
import { CriteriaPanel } from '@/components/smart-matching/CriteriaPanel'
import { ResultPanel } from '@/components/smart-matching/ResultPanel'

const contentMap = {
  id: {
    badge: "AI-POWERED MATCHING ENGINE",
    title: "Temukan Penawaran Minyak Nilam Terideal",
    subtitle: "Algoritma MCDM Valam secara cerdas menganalisis ribuan data CoA terverifikasi untuk memfilter PA%, Tingkat Air, Volume, dan Harga secara real-time.",
    btnStart: "Mulai Pencarian",
    howItWorks: {
      badge: "ALUR KERJA",
      title: "Cara Kerja Smart Matching",
      subtitle: "Dapatkan supplier terbaik untuk kebutuhan industri Anda dalam 3 langkah mudah.",
      step1: { title: "Atur Kriteria Kualitas", desc: "Tentukan target volume, batas anggaran maksimum, kadar minimum PA, dan kadar air maksimum yang Anda butuhkan." },
      step2: { title: "Kalkulasi MCDM Cerdas", desc: "Sistem kami memindai database CoA digital terverifikasi GPS dan menghitung bobot nilai kecocokan kriteria Anda." },
      step3: { title: "Dapatkan Peringkat Terbaik", desc: "Hasil pencarian menampilkan daftar supplier berdasarkan Skor Kecocokan tertinggi. Anda dapat langsung membandingkan." }
    },
    form: {
      title: "Kriteria Kebutuhan",
      volume: "Target Volume",
      budget: "Anggaran Maks / Kg",
      minPa: "Minimal Kadar PA%",
      maxMoisture: "Maksimal Kadar Air%",
      btnSubmit: "Temukan Rekomendasi",
      btnLoading: "Mengkalkulasi..."
    },
    results: {
      title: "Hasil Peringkat Kecocokan",
      subtitle: "Diurutkan berdasarkan MCDM Match Score",
      readyTitle: "Siap Melakukan Pencocokan",
      readyDesc: "Masukkan target spesifikasi kargo Anda di sisi kiri dan klik \"Temukan Rekomendasi\" untuk membandingkan kecocokan CoA secara instan.",
      emptyTitle: "Spesifikasi Terlalu Ketat",
      emptyDesc: "Maaf, tidak ada batch terdaftar yang saat ini memenuhi syarat kriteria di atas. Silakan naikkan batas Anggaran atau longgarkan minimal kadar PA%.",
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
    title: "Find the Ideal Patchouli Oil Match",
    subtitle: "Valam's MCDM algorithm intelligently analyzes thousands of verified CoA data to filter PA%, Moisture, Volume, and Price in real-time.",
    btnStart: "Start Search",
    howItWorks: {
      badge: "WORKFLOW",
      title: "How Smart Matching Works",
      subtitle: "Get the best supplier for your industry needs in 3 easy steps.",
      step1: { title: "Set Quality Criteria", desc: "Determine the target volume, maximum budget, minimum PA levels, and maximum moisture levels you require." },
      step2: { title: "Intelligent MCDM Calculation", desc: "Our system scans the verified digital CoA database and automatically calculates matching weights." },
      step3: { title: "Get Best Rankings", desc: "Search results show suppliers ranked by Match Score. You can instantly compare and proceed." }
    },
    form: {
      title: "Requirement Criteria",
      volume: "Target Volume",
      budget: "Max Budget / Kg",
      minPa: "Min PA% Level",
      maxMoisture: "Max Moisture Level",
      btnSubmit: "Find Recommendations",
      btnLoading: "Calculating..."
    },
    results: {
      title: "Matching Rank Results",
      subtitle: "Sorted by MCDM Match Score",
      readyTitle: "Ready to Match",
      readyDesc: "Enter your target cargo specifications on the left and click \"Find Recommendations\" to instantly compare CoA matches.",
      emptyTitle: "Specifications Too Strict",
      emptyDesc: "Sorry, no registered batches currently meet your criteria. Please increase the Budget limit or loosen the minimum PA% requirement.",
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
  const t = contentMap[locale] || contentMap.id
  
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  
  const [criteria, setCriteria] = useState({
    volume_kg: 100,
    max_budget: 900000,
    min_pa: 30,
    max_moisture: 5
  })

  // Load criteria search state from URL query params or sessionStorage if returning
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const qVolume = urlParams.get('volume');
      const qMinPa = urlParams.get('min_pa');
      const qMaxBudget = urlParams.get('max_budget');
      const qMaxMoisture = urlParams.get('max_moisture');

      if (qVolume || qMinPa || qMaxBudget || qMaxMoisture) {
        const loadedCriteria = {
          volume_kg: qVolume ? Number(qVolume) : 200,
          max_budget: qMaxBudget ? Number(qMaxBudget) : 850000,
          min_pa: qMinPa ? Number(qMinPa) : 30,
          max_moisture: qMaxMoisture ? Number(qMaxMoisture) : 5
        };
        setCriteria(loadedCriteria);
        // Delay search trigger slightly so page is fully mounted
        setTimeout(() => {
          handleSearch(loadedCriteria);
        }, 150);
        return;
      }

      const savedVolume = sessionStorage.getItem('pub_matching_volume')
      const savedMinPa = sessionStorage.getItem('pub_matching_minPa')
      const savedMaxBudget = sessionStorage.getItem('pub_matching_maxBudget')
      const savedMaxMoisture = sessionStorage.getItem('pub_matching_maxMoisture')
      const savedHasSearched = sessionStorage.getItem('pub_matching_searched')
      const savedResults = sessionStorage.getItem('pub_matching_results')

      if (savedVolume || savedMinPa || savedMaxBudget || savedMaxMoisture) {
        setCriteria({
          volume_kg: savedVolume ? Number(savedVolume) : 100,
          max_budget: savedMaxBudget ? Number(savedMaxBudget) : 900000,
          min_pa: savedMinPa ? Number(savedMinPa) : 30,
          max_moisture: savedMaxMoisture ? Number(savedMaxMoisture) : 5
        })
      }
      if (savedHasSearched === 'true') setHasSearched(true)
      if (savedResults) setResults(JSON.parse(savedResults))
    }
  }, [])

  // Persist criteria state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pub_matching_volume', String(criteria.volume_kg))
      sessionStorage.setItem('pub_matching_minPa', String(criteria.min_pa))
      sessionStorage.setItem('pub_matching_maxBudget', String(criteria.max_budget))
      sessionStorage.setItem('pub_matching_maxMoisture', String(criteria.max_moisture))
      sessionStorage.setItem('pub_matching_searched', String(hasSearched))
      sessionStorage.setItem('pub_matching_results', JSON.stringify(results))
    }
  }, [criteria, hasSearched, results])

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
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
      console.warn("Backend offline, calculating locally using MCDM fallback:", err)
      const baseProducts: any[] = []
      
      mockProducts.forEach((p: any) => {
        if (p.status === 'VERIFIED' || p.status === 'ACTIVE') {
          const supplierName = p.supplier_name || '';
          const mappedId = 
            supplierName.toLowerCase().includes('aceh barat') ? 'sup_aceh_west' :
            supplierName.toLowerCase().includes('tani makmur') ? 'sup_tani_makmur' :
            supplierName.toLowerCase().includes('gayo') ? 'sup_atsiri_gayo' :
            supplierName.toLowerCase().includes('selatan') ? 'sup_nilam_south' :
            supplierName.toLowerCase().includes('nusantara') ? 'sup_tani_nusantara' :
            'sup_aceh_west';

          baseProducts.push({
            id: p.id,
            batch_code: p.batch_code,
            supplier_name: supplierName || 'Supplier Valam',
            supplier_id: p.supplier_id || mappedId,
            available_volume_kg: p.available_volume_kg,
            pa_percentage: p.pa_percentage,
            moisture: p.moisture,
            price_per_kg: p.price_per_kg,
            origin_district: p.origin_district,
            origin_village: p.origin_village
          })
        }
      })

      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('valam_supplier_batches_')) {
            const supplierEmail = key.replace('valam_supplier_batches_', '')
            const supplierBatches = JSON.parse(localStorage.getItem(key) || '[]')
            supplierBatches.forEach((b: any) => {
              if (b.status === 'VERIFIED' || b.status === 'ACTIVE') {
                if (!baseProducts.some(p => p.id === b.id || p.batch_code === b.batch_code)) {
                  baseProducts.push({
                    id: b.id,
                    batch_code: b.batch_code,
                    supplier_name: localStorage.getItem('valam_user_company_' + supplierEmail) || 'Koperasi Atsiri Mandiri',
                    supplier_id: 'supplier_' + supplierEmail,
                    available_volume_kg: Number(b.available_volume_kg || b.volume_kg || 100),
                    pa_percentage: Number(b.pa_percentage || 30.0),
                    moisture: Number(b.moisture || 4.0),
                    price_per_kg: Number(b.price_per_kg || 900000),
                    origin_district: b.origin_district || 'Aceh',
                    origin_village: b.origin_village
                  })
                }
              }
            })
          }
        }
      }

      // MCDM Scoring Fallback
      const calculated = baseProducts.map(item => {
        let score = 100
        
        // Volume match factor
        const volDiffRatio = Math.abs(item.available_volume_kg - activeCriteria.volume_kg) / activeCriteria.volume_kg
        const volScore = Math.max(0, 100 - volDiffRatio * 50)

        // Budget match factor
        let budgetScore = 100
        if (item.price_per_kg > activeCriteria.max_budget) {
          const budgetOverRatio = (item.price_per_kg - activeCriteria.max_budget) / activeCriteria.max_budget
          budgetScore = Math.max(0, 100 - budgetOverRatio * 150)
        }

        // PA match factor
        let paScore = 100
        if (item.pa_percentage < activeCriteria.min_pa) {
          const paUnderRatio = (activeCriteria.min_pa - item.pa_percentage) / activeCriteria.min_pa
          paScore = Math.max(0, 100 - paUnderRatio * 200)
        }

        // Moisture match factor
        let moistureScore = 100
        if (item.moisture > activeCriteria.max_moisture) {
          const moistureOverRatio = (item.moisture - activeCriteria.max_moisture) / activeCriteria.max_moisture
          moistureScore = Math.max(0, 100 - moistureOverRatio * 100)
        }

        score = (volScore * 0.25) + (budgetScore * 0.25) + (paScore * 0.35) + (moistureScore * 0.15)

        return {
          ...item,
          match_score: Math.round(score)
        }
      })

      // Filter out matches with zero score or very poor PA
      const filtered = calculated.filter(item => item.match_score >= 10 && item.pa_percentage >= activeCriteria.min_pa - 3)
      filtered.sort((a, b) => b.match_score - a.match_score)
      setResults(filtered)
      setHasSearched(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col selection:bg-emerald-100 selection:text-emerald-950 font-sans">
      <Navbar />

      {/* Hero Header Area */}
      <SmartMatchingHero
        badge={t.badge}
        title={t.title}
        subtitle={t.subtitle}
        btnStart={t.btnStart}
        onScrollToForm={scrollToForm}
        locale={locale}
      />

      {/* Step Guide - How it works */}
      <HowItWorksSection
        badge={t.howItWorks.badge}
        title={t.howItWorks.title}
        subtitle={t.howItWorks.subtitle}
        step1={t.howItWorks.step1}
        step2={t.howItWorks.step2}
        step3={t.howItWorks.step3}
      />

      {/* Main Form and Output Block */}
      <section ref={formRef} className="lg:h-[calc(100vh-80px)] h-auto py-10 lg:py-6 flex flex-col max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-20 overflow-hidden shrink-0">
        <div className="grid lg:grid-cols-12 gap-8 items-stretch h-full overflow-hidden">
          
          {/* Input criteria dark panel */}
          <div className="lg:col-span-4 lg:h-full h-auto flex flex-col overflow-hidden">
            <CriteriaPanel
              criteria={criteria}
              onCriteriaChange={setCriteria}
              onSubmit={() => handleSearch()}
              loading={loading}
              locale={locale}
              translations={t.form}
            />
          </div>

          {/* Results panel list */}
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
      </section>

      <Footer />
    </div>
  )
}

