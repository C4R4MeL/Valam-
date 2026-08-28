'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/utils';

interface Product {
  id: string;
  batch_code: string;
  supplier_name: string;
  supplier_id: string;
  available_volume_kg: number;
  pa_percentage: number;
  moisture: number;
  price_per_kg: number;
  match_score: number;
  origin_district?: string;
  origin_village?: string;
}

interface MatchResultCardProps {
  product: Product;
  idx: number;
  locale: string;
  checked: boolean;
  onCompareToggle: (id: string) => void;
  onRfqClick: (e: React.MouseEvent) => void;
  criteria: {
    volume_kg: number;
    min_pa: number;
    max_budget: number;
    max_moisture: number;
  };
  translations: {
    matchScore: string;
    stock: string;
    pa: string;
    moisture: string;
    priceLabel: string;
    btnDetail: string;
    btnRfq: string;
    bestMatch: string;
  };
  isAuthenticated: boolean;
  role: string | null;
}

export function MatchResultCard({
  product,
  idx,
  locale,
  checked,
  onCompareToggle,
  onRfqClick,
  criteria,
  translations,
  isAuthenticated,
  role,
}: MatchResultCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const isBestRank = idx === 0;

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: idx * 0.1 }}
      className={`relative bg-white p-5 md:p-6 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row items-center gap-6 overflow-hidden select-none
        ${isBestRank
          ? 'border-gold-400'
          : 'border-zinc-200 hover:border-forest-500/30 hover:shadow-md'
        }`}
      style={isBestRank ? { boxShadow: '0 0 20px rgba(242, 201, 76, 0.2)' } : undefined}
    >
      
      {/* Rank Indicator Badge */}
      <div className={`absolute top-0 left-0 w-8 h-8 flex items-center justify-center font-black rounded-br-xl shadow-sm text-xs border-r border-b border-zinc-150
        ${isBestRank ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-forest-950' : 'bg-zinc-100 text-zinc-600'}
      `}>
        #{idx + 1}
      </div>

      {/* Best Recommendation Ribbon Badge */}
      {isBestRank && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-gold-450 to-gold-350 text-forest-950 text-[10px] font-bold px-3.5 py-1.5 rounded-bl-xl shadow-sm flex items-center gap-1">
          <span>🏆</span> {translations.bestMatch}
        </div>
      )}

      {/* Checkbox for Comparison selection */}
      <div className="absolute top-3 right-3 md:relative md:top-auto md:right-auto shrink-0 flex items-center justify-center pl-2">
        <label className="relative flex items-center justify-center cursor-pointer p-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => onCompareToggle(product.id || String(idx))}
            className="peer sr-only"
          />
          <div className="w-5 h-5 rounded border border-zinc-300 bg-white peer-checked:bg-forest-600 peer-checked:border-forest-600 transition-colors flex items-center justify-center">
            {checked && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </label>
      </div>

      {/* Score Circular Badge */}
      <div className={`flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-full border shadow-inner
        ${isBestRank ? 'bg-gold-50/50 border-gold-200' : 'bg-forest-50/50 border-forest-100'}`}>
        <div className="text-center">
          <span className={`block text-2xl font-black leading-none ${isBestRank ? 'text-gold-700' : 'text-forest-700'}`}>{product.match_score}%</span>
          <span className="block text-[8px] uppercase font-bold text-warm-700 tracking-wider mt-0.5">{translations.matchScore}</span>
        </div>
      </div>

      {/* Info & Score Bar */}
      <div className="flex-1 text-center md:text-left w-full space-y-2">
        <h3 className="text-lg font-bold text-forest-950 flex flex-wrap items-center justify-center md:justify-start gap-1.5">
          {product.supplier_name}
          <ShieldCheck className="w-4 h-4 text-forest-500 shrink-0" />
          {product.origin_district && (
            <span className="inline-flex items-center gap-1 bg-terracotta-100 text-terracotta-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-terracotta-200/50 ml-1">
              <span className="w-1 h-1 rounded-full bg-terracotta-500 animate-pulse" />
              {product.origin_district}
            </span>
          )}
        </h3>
        
        {/* Specs detail row */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-xs text-warm-700 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-forest-500 shrink-0" />
            {translations.stock}: <strong className="text-forest-950 font-bold">{product.available_volume_kg} kg</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-forest-500 shrink-0" />
            {translations.pa}: <strong className="text-forest-950 font-bold">{product.pa_percentage}%</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-forest-500 shrink-0" />
            {translations.moisture}: <strong className="text-forest-950 font-bold">{product.moisture}%</strong>
          </div>
        </div>

        {/* Animated Score Bar */}
        <div className="space-y-1 pt-1">
          <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden border border-zinc-200/50">
            <motion.div
              initial={prefersReducedMotion ? { width: `${product.match_score}%` } : { width: '0%' }}
              animate={{ width: `${product.match_score}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.15 }}
              className="h-full bg-gradient-to-r from-forest-500 to-forest-400 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Action panel & Price */}
      <div className="flex flex-col items-end gap-2.5 min-w-[180px] w-full md:w-auto border-t md:border-t-0 border-zinc-100 pt-4 md:pt-0 shrink-0">
        <div className="text-center md:text-right w-full">
          <p className="text-[10px] text-zinc-400 mb-0.5">{translations.priceLabel}</p>
          <p className={`text-lg font-extrabold leading-none ${isBestRank ? 'text-gold-700' : 'text-forest-700'}`}>
            {formatRupiah(product.price_per_kg)}
            <span className="text-xs font-normal text-zinc-450">/kg</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full">
          <Link href={`/katalog/${product.id}?from=matching&match_score=${product.match_score}`} className="flex-1">
            <Button variant="outline" className="w-full border-forest-200 text-forest-700 hover:bg-forest-50 hover:text-forest-800 h-9 text-xs font-bold rounded-lg px-2 transition-all">
              {translations.btnDetail}
            </Button>
          </Link>
          {isAuthenticated && role !== 'buyer' ? (
            <button
              disabled
              title={locale === 'en' ? 'This feature is only for Buyer accounts' : 'Fitur ini khusus untuk akun Buyer'}
              className="flex-1 w-full bg-zinc-100 border border-zinc-200 text-zinc-400 font-bold h-9 text-xs rounded-lg px-2 opacity-50 cursor-not-allowed text-center"
            >
              {translations.btnRfq}
            </button>
          ) : (
            <Link 
              href={`/buyer/rfq?supplier=${product.supplier_id}&supplier_name=${encodeURIComponent(product.supplier_name)}&volume=${criteria.volume_kg}&minPa=${criteria.min_pa}&budget=${criteria.max_budget}&moisture=${criteria.max_moisture}&from=public`} 
              className="flex-1" 
              onClick={onRfqClick}
            >
              <Button className="w-full bg-forest-700 hover:bg-forest-600 text-white font-bold h-9 text-xs rounded-lg px-2 border border-forest-800/40 transition-colors">
                {translations.btnRfq}
              </Button>
            </Link>
          )}
        </div>
      </div>

    </motion.div>
  );
}

export default MatchResultCard;
