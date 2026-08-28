'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Link } from '@/i18n/routing'
import { Leaf, ArrowLeft, ShoppingCart, CheckCircle2 } from 'lucide-react'
import { mockProducts, formatRupiah } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { TimelineHistory } from '@/components/traceability/TimelineHistory'
import { CoAViewer } from '@/components/qc/CoAViewer'
import { useLocale } from 'next-intl'

const contentMap = {
  id: {
    back: "Kembali ke Katalog",
    title: "Jejak Kualitas Terverifikasi",
    desc: "Setiap tetes minyak nilam Valam memiliki cerita. Lacak perjalanan produk ini dari perkebunan hingga tersertifikasi di laboratorium kami.",
    suppliedBy: "Disuplai oleh",
    quality: "Kualitas",
    volume: "Volume",
    btnBuy: "Beli Produk Ini",
    mapTitle: "Peta Asal Lahan",
    timelineTitle: "Timeline Perjalanan",
    docTitle: "Dokumen Sertifikasi Fisik",
    footerRight: "Hak Cipta Dilindungi.",
    footerTagline: "Marketplace minyak nilam B2B terverifikasi."
  },
  en: {
    back: "Back to Catalog",
    title: "Verified Quality Trail",
    desc: "Every drop of Valam patchouli oil has a story. Trace this product's journey from the plantation to certification in our laboratory.",
    suppliedBy: "Supplied by",
    quality: "Quality",
    volume: "Volume",
    btnBuy: "Buy This Product",
    mapTitle: "Origin Map",
    timelineTitle: "Journey Timeline",
    docTitle: "Physical Certification Documents",
    footerRight: "All rights reserved.",
    footerTagline: "The verified B2B patchouli oil marketplace."
  }
}

export default function TraceabilityPage() {
  const params = useParams()
  const batchId = params.batchId as string // actually batchCode based on URL
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id
  
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    fetch(`${API_URL}/trace/code/${batchId}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [batchId])

  if (loading) return <div className="p-20 text-center">Loading Traceability Data...</div>
  if (!product || product.error) return <div className="p-20 text-center">Product not found.</div>

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans selection:bg-gold-200 selection:text-emerald-950">
      
      {/* Simplified Header */}
      <header className="bg-emerald-950 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link className="flex items-center gap-2 group w-fit" href="/">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg">
              <Leaf className="w-4 h-4 text-emerald-950" />
            </div>
            <span className="font-serif font-bold text-xl tracking-tight text-white hidden sm:block">
              Valam<span className="text-gold-400">.</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/marketplace">
              <Button variant="ghost" className="text-emerald-100 hover:text-white hover:bg-emerald-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.back}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Page Title & Summary Card */}
        <div className="mb-10 text-center animate-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-emerald-950 mb-4">
            {t.title}
          </h1>
          <p className="text-zinc-500 max-w-2xl mx-auto mb-8">
            {t.desc}
          </p>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200 shadow-xl shadow-zinc-200/50 max-w-4xl mx-auto flex flex-col sm:flex-row gap-6 items-center justify-between text-left">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-emerald-600 tracking-widest uppercase bg-emerald-50 px-2 py-1 rounded">BATCH ID</span>
              </div>
              <h2 className="text-2xl font-mono font-bold text-zinc-900">{product.batch_code}</h2>
              <p className="text-zinc-500 text-sm mt-1">{t.suppliedBy} <span className="font-semibold text-zinc-700">{product.supplier?.profile?.company_name || 'N/A'}</span></p>
            </div>
            
            <div className="hidden sm:block w-px h-16 bg-zinc-200"></div>
            
            <div className="flex gap-8">
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">{t.quality}</p>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  PA {product.qc_result?.pa_percentage || 0}%
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">{t.volume}</p>
                <div className="font-bold text-zinc-900">
                  {product.available_volume_kg} Kg
                </div>
              </div>
            </div>
            
            <div className="w-full sm:w-auto">
              <Link href={`/marketplace/product/${product.id}`}>
                <Button className="w-full bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold shadow-lg shadow-gold-500/20 h-12 px-8">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {t.btnBuy}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* Left Column: Map & Timeline */}
          <div className="lg:col-span-5 space-y-10 animate-in slide-in-from-left-8 duration-700 delay-150 fill-mode-both">
            
            <section>
              <h2 className="text-xl font-bold text-emerald-950 mb-6 flex items-center gap-2">
                {t.mapTitle}
              </h2>
              <div className="bg-white rounded-2xl border border-zinc-200 p-2 shadow-sm h-64 overflow-hidden relative group">
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127504.42340321477!2d96.06416182390234!3d4.142348574768311!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x303ec3a0d5c0b7d1%3A0x3344d56ab368a5c3!2sWoyla%20Barat%2C%20Kabupaten%20Aceh%20Barat%2C%20Aceh!5e0!3m2!1sid!2sid!4v1718000000000!5m2!1sid!2sid" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, borderRadius: '0.75rem' }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale contrast-125 opacity-90 group-hover:grayscale-0 transition-all duration-700"
                ></iframe>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-emerald-950 mb-6">
                {t.timelineTitle}
              </h2>
              <TimelineHistory batch={product} />
            </section>

          </div>

          {/* Right Column: CoA Viewer */}
          <div className="lg:col-span-7 animate-in slide-in-from-right-8 duration-700 delay-300 fill-mode-both">
             <h2 className="text-xl font-bold text-emerald-950 mb-6 lg:text-right">
                {t.docTitle}
              </h2>
              <CoAViewer batch={product} />
          </div>

        </div>
      </main>
      
      <footer className="bg-emerald-950 py-12 mt-20 text-center border-t-4 border-gold-500">
        <Leaf className="w-8 h-8 text-gold-500 mx-auto mb-4" />
        <p className="text-emerald-200/50 text-sm">© 2026 Valam Ecosystem. {t.footerRight}</p>
        <p className="text-emerald-200/30 text-xs mt-2">{t.footerTagline}</p>
      </footer>
    </div>
  )
}
