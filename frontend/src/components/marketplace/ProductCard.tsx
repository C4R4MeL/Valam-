'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, FlaskConical, MapPin, Star, Beaker, FileText, ArrowRight, Leaf, Download, Calendar, ShieldCheck, Archive, ChevronDown, Droplets } from 'lucide-react'
import { useLocale } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { formatRupiah, getPatchouliTier, getTierColorClass, isGcmsVerified } from '@/lib/utils'

interface ProductCardProps {
  product: {
    id: string
    batch_code: string
    supplier_name: string
    status: string
    origin_district: string
    pa_percentage: number
    moisture: number
    available_volume_kg: number
    price_per_kg: number
    images: string[]
    refractive_index?: number
    optical_rotation?: number
    is_featured?: boolean
    is_circular?: boolean
    category?: string
    benefit?: string
    description?: string
    unit?: string
    tested_at?: string
    origin_village?: string
    mitra_pengolah_nama?: string
    stok_tersedia?: number
    sustainability_score?: number
    harga_per_unit?: number
    min_order?: number
    nama?: string
  }
}

const resolveProductImage = (imagePath?: string) => {
  if (!imagePath) return '/images/premium_oil_dark.png';
  if (imagePath.includes('compost')) {
    return "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&h=400&fit=crop";
  }
  if (imagePath.includes('biochar')) {
    return "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=600&h=400&fit=crop";
  }
  if (imagePath.includes('hydrosol')) {
    return "https://images.unsplash.com/photo-1617897903246-719242758050?w=600&h=400&fit=crop";
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('/uploads/')) {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
    const origin = API_URL.replace(/\/api$/, '');
    return `${origin}${imagePath}`;
  }
  return imagePath;
}

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=400&fit=crop", 
  "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&h=400&fit=crop"  
];

const getProductImage = (product: any) => {
  if (product.images && product.images.length > 0 && !product.images[0].includes("premium_oil_dark")) {
    return resolveProductImage(product.images[0]);
  }
  let hash = 0;
  const str = product.batch_code || "";
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % UNSPLASH_IMAGES.length;
  return UNSPLASH_IMAGES[index];
}

export function ProductCard({ product }: ProductCardProps) {
  const locale = useLocale()
  const isId = locale === 'id'
  const isVerified = isGcmsVerified(product.status)
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Using original batch code from database as per user's preference

  // Determine if product is a featured choice
  const isFeatured = product.is_featured || product.pa_percentage >= 34

  // Deterministic Mock Match Percentage (78-98%) based on ID
  const matchPercentage = useMemo(() => {
    let hash = 0;
    const str = product.id;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 78 + (Math.abs(hash) % 21);
  }, [product.id]);

  // Mock Iron (ppm) based on ID
  const mockIron = useMemo(() => {
    let hash = 0;
    const str = product.batch_code;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return product.pa_percentage >= 30 ? (Math.abs(hash) % 3) + 1 : (Math.abs(hash) % 8) + 3;
  }, [product.batch_code, product.pa_percentage]);

  const tier = getPatchouliTier(product.pa_percentage);
  const tierInfo = {
    label: tier,
    colorClass: getTierColorClass(tier) + ' shadow-sm'
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return isId ? 'Belum Uji' : 'Not Tested';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(isId ? 'id-ID' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(date);
  }

  return (
    <div className="group block h-full">
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:border-[#1A4D2E]/40 hover:shadow-2xl hover:shadow-[#1A4D2E]/10 transition-all duration-300 h-full flex flex-col relative">
        
        {/* Floating Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
          {product.is_circular ? (
             <div className="flex items-center gap-1 bg-white/90 backdrop-blur text-[#1A4D2E] px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-sm border border-[#1A4D2E]/20">
               <Leaf className="w-3 h-3 text-[#1A4D2E] animate-pulse" />
               {product.category || 'Circular'}
             </div>
          ) : (
            <div className="flex flex-col gap-1 items-start">
              <div className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-sm ${tierInfo.colorClass}`}>
                {tierInfo.label}
              </div>
              
              {/* Featured Choice Badge with Mobile timestamp */}
              {isFeatured && (
                <div className="flex flex-col gap-1 items-start">
                  <div className="flex items-center gap-1 bg-valam-gold text-[#1A4D2E] px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase shadow-sm">
                    <Star className="w-3 h-3 fill-[#1A4D2E] text-[#1A4D2E]" />
                    <span>{isId ? "FEATURED CHOICE" : "FEATURED CHOICE"}</span>
                  </div>
                  <span className="md:hidden text-[8px] font-semibold text-white/95 bg-black/55 backdrop-blur-sm px-1.5 py-0.5 rounded">
                    Updated 2j lalu
                  </span>
                </div>
              )}
            </div>
          )}
          
          {isVerified && (
            <div className="flex items-center gap-1 bg-[#1A4D2E]/90 backdrop-blur text-white px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase shadow-sm">
              <CheckCircle2 className="w-3 h-3 text-valam-gold-400" />
              {isId ? "Terverifikasi GC-MS" : "GC-MS Verified"}
            </div>
          )}
        </div>
        
        {/* Match% Badge (Right Side) - Displays if came from matching */}
        {!product.is_circular && (
          <div className="absolute top-3 right-3 z-10">
            <div className="flex flex-col items-center justify-center bg-white/95 backdrop-blur rounded-lg p-1.5 shadow-md border border-zinc-100">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-0.5">Match</span>
              <span className={`text-sm font-black leading-none ${matchPercentage >= 90 ? 'text-valam-green' : 'text-valam-gold-500'}`}>
                {matchPercentage}%
              </span>
            </div>
          </div>
        )}

        {/* Image Section */}
        <div className="relative h-44 w-full bg-zinc-100 overflow-hidden">
          <Image 
            src={getProductImage(product)} 
            alt={product.batch_code}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end text-white">
            <div className="font-mono text-sm tracking-wider font-bold truncate max-w-[150px]" title={product.batch_code}>
              {product.batch_code}
            </div>
          </div>
          
          {/* Action Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center backdrop-blur-[2px]">
            <Link 
              href={product.is_circular ? `/${locale}/katalog/circular/${product.id}` : `/${locale}/katalog/${product.id}`}
              className="bg-white/95 text-[#1A4D2E] hover:bg-[#1A4D2E] hover:text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 border border-white/50"
            >
              {isId ? "Lihat Detail" : "View Detail"}
            </Link>
          </div>

          {!product.is_circular && (
            <div className="absolute top-0 right-3 bg-[#1A4D2E] text-white px-2 pt-2.5 pb-2 rounded-b-lg shadow-md flex flex-col items-center z-10 border border-t-0 border-white/20">
              <span className="text-[10px] uppercase font-bold tracking-widest text-valam-gold-300 opacity-90 mb-0.5">PA</span>
              <span className="font-serif font-bold text-sm leading-none flex items-baseline">
                {product.pa_percentage}
                <span className="text-[10px] ml-0.5">%</span>
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col flex-1 relative z-30 bg-white">
          <div className="flex-1">
            <h3 className="font-serif font-bold text-zinc-900 text-[15px] mb-1 line-clamp-2 leading-snug group-hover:text-[#1A4D2E] transition-colors">
              {product.is_circular ? product.nama : product.supplier_name}
            </h3>
            
            <p className="text-[11px] text-zinc-500 font-medium mb-3 flex items-center gap-1.5 line-clamp-1">
              {product.is_circular ? (
                <>
                  <Leaf className="w-3.5 h-3.5 text-[#1A4D2E]" />
                  Mitra: {product.mitra_pengolah_nama}
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5 text-[#1A4D2E]" />
                  {product.origin_district} • {product.origin_village || 'Lokal'}
                </>
              )}
            </p>

            {product.is_circular ? (
              <div className="bg-zinc-50 rounded-lg p-2.5 mb-3 border border-zinc-100 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-[#1A4D2E] shrink-0" />
                <p className="text-[10px] text-zinc-600 leading-snug line-clamp-2">
                  <span className="font-bold text-zinc-800">{isId ? 'Manfaat: ' : 'Benefit: '}</span> 
                  {product.benefit}
                </p>
              </div>
            ) : (
              <div className="space-y-1 mb-4">
                <div className="relative h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-red-500 via-valam-gold-400 to-[#1A4D2E]"
                    style={{ width: `${Math.min(Math.max((product.pa_percentage / 35) * 100, 0), 100)}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {product.is_circular ? (
                <>
                  <div className="bg-zinc-50/80 rounded-lg p-2 flex items-center gap-2 border border-zinc-100 group-hover:border-[#1A4D2E]/20 transition-colors">
                    <div className="bg-white p-1 rounded shadow-sm border border-zinc-100 shrink-0">
                      <Droplets className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{isId ? "Stok" : "Stock"}</p>
                      <p className="text-xs font-bold text-zinc-900">{product.stok_tersedia} {product.unit || 'Kg'}</p>
                    </div>
                  </div>
                  <div className="bg-zinc-50/80 rounded-lg p-2 flex items-center gap-2 border border-zinc-100 group-hover:border-[#1A4D2E]/20 transition-colors">
                    <div className="bg-white p-1 rounded shadow-sm border border-zinc-100 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Score</p>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < (product.sustainability_score || 0) ? 'text-valam-gold-400 fill-valam-gold-400' : 'text-zinc-200'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-zinc-50 rounded-lg p-2 border border-zinc-100 flex flex-col">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1 mb-0.5">
                      <Archive className="w-2.5 h-2.5" /> Volume
                    </span>
                    <span className="text-xs font-bold text-zinc-800">{product.available_volume_kg} Kg</span>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-2 border border-zinc-100 flex flex-col">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1 mb-0.5">
                      <Calendar className="w-2.5 h-2.5" /> Uji Lab
                    </span>
                    <span className="text-xs font-bold text-zinc-800">{formatDate(product.tested_at)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Footer: Price & Buttons */}
          <div className="pt-3 border-t border-zinc-100 mt-auto">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                  {product.is_circular ? `${isId ? "Harga" : "Price"} / ${product.unit || 'Unit'}` : `${isId ? "Harga / Kg" : "Price / Kg"}`}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-[#1A4D2E] leading-none">
                    {formatRupiah(product.is_circular ? (product.harga_per_unit || 0) : product.price_per_kg)}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400">
                    (MOQ: {product.is_circular ? product.min_order : '1'} {product.is_circular ? product.unit || 'Unit' : 'Kg'})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              {product.is_circular ? (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if ((window as any).openCircularOrderModal) {
                      (window as any).openCircularOrderModal(product);
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 bg-[#1A4D2E] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#123320] transition-colors shadow-md shadow-[#1A4D2E]/10"
                >
                  {isId ? "Pesan Sekarang" : "Order Now"}
                </button>
              ) : (
                <Link 
                  href={`/${locale}/katalog/${product.id}`}
                  className="flex items-center justify-center gap-1.5 bg-[#1A4D2E] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#123320] transition-colors shadow-md shadow-[#1A4D2E]/10"
                >
                  {isId ? "Lihat Detail" : "View Detail"}
                </Link>
              )}
              
              <div className="grid grid-cols-2 gap-1.5">
                <Link 
                  href={product.is_circular ? `/${locale}/katalog/circular/${product.id}` : `/${locale}/katalog/${product.id}`}
                  className="flex items-center justify-center gap-1 bg-white border border-[#1A4D2E] text-[#1A4D2E] text-[10px] font-bold py-2 rounded-xl hover:bg-[#1A4D2E]/5 transition-colors"
                >
                  {!product.is_circular && <Download className="w-3.5 h-3.5" />}
                  {product.is_circular ? (isId ? "Detail" : "Detail") : (isId ? "Unduh CoA" : "CoA")}
                </Link>
                
                {!product.is_circular && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `/${locale}/dashboard/buyer/rfq/new?product_id=${product.id}`;
                    }}
                    className="flex items-center justify-center gap-1 bg-white border border-[#B69A1D] text-[#B69A1D] text-[10px] font-bold py-2 rounded-xl hover:bg-valam-gold-50 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {isId ? "Create RFQ" : "Create RFQ"}
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
