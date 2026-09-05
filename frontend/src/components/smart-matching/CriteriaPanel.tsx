'use client';

import React from 'react';
import { SlidersHorizontal, Search, RotateCcw, HelpCircle, Sparkles } from 'lucide-react';
import { CustomSlider } from './CustomSlider';
import { formatRupiah } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Criteria {
  volume_kg: number;
  max_budget: number;
  min_pa: number;
  max_moisture: number;
}

interface CriteriaPanelProps {
  criteria: Criteria;
  onCriteriaChange: (newCriteria: Criteria) => void;
  onSubmit: () => void;
  onReset?: () => void;
  loading: boolean;
  locale: string;
  translations: {
    title: string;
    volume: string;
    budget: string;
    minPa: string;
    maxMoisture: string;
    btnSubmit: string;
    btnLoading: string;
  };
}

export function CriteriaPanel({
  criteria,
  onCriteriaChange,
  onSubmit,
  onReset,
  loading,
  locale,
  translations,
}: CriteriaPanelProps) {
  const isEn = locale === 'en';

  const updateField = (key: keyof Criteria, value: number) => {
    onCriteriaChange({
      ...criteria,
      [key]: value,
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm flex flex-col max-h-[640px] md:max-h-[680px] overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-150 pb-4 shrink-0 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1A4D2E]/10 text-[#1A4D2E] flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">
              {translations.title}
            </h3>
            <p className="text-[11px] text-zinc-400">
              {isEn ? 'Adjust order parameters' : 'Sesuaikan parameter pesanan'}
            </p>
          </div>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-semibold text-zinc-400 hover:text-[#1A4D2E] transition-colors flex items-center gap-1 cursor-pointer"
            title={isEn ? 'Reset to default' : 'Kembalikan ke standar'}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Inputs list with vertical scroll */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
        
        {/* 1. Target Volume */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-700">{translations.volume}</span>
            <span className="font-mono font-bold text-[#1A4D2E] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              {criteria.volume_kg} Kg
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            {isEn ? 'Minimum B2B order starts at 50 kg' : 'Pesanan B2B umumnya mulai dari 50 kg'}
          </p>

          {/* Quick preset buttons */}
          <div className="flex gap-1.5 pt-0.5">
            {[50, 100, 200, 500].map((vol) => (
              <button
                key={vol}
                type="button"
                onClick={() => updateField('volume_kg', vol)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                  criteria.volume_kg === vol
                    ? 'bg-[#1A4D2E] text-white border-[#1A4D2E]'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
              >
                {vol} Kg
              </button>
            ))}
          </div>

          <CustomSlider
            value={criteria.volume_kg}
            min={20}
            max={1000}
            step={10}
            unit=" Kg"
            onValueChange={(val) => updateField('volume_kg', val)}
          />
        </div>

        {/* 2. Max Budget */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-700">{translations.budget}</span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              {formatRupiah(criteria.max_budget)}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            {isEn ? 'Market range approx. Rp 750k - Rp 950k/Kg' : 'Kisaran pasar saat ini Rp 750rb - Rp 950rb/Kg'}
          </p>

          {/* Quick budget buttons */}
          <div className="flex gap-1.5 pt-0.5">
            {[
              { label: '800 rb', val: 800000 },
              { label: '900 rb', val: 900000 },
              { label: '1 Jt', val: 1000000 }
            ].map((b) => (
              <button
                key={b.val}
                type="button"
                onClick={() => updateField('max_budget', b.val)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                  criteria.max_budget === b.val
                    ? 'bg-[#1A4D2E] text-white border-[#1A4D2E]'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          <CustomSlider
            value={criteria.max_budget}
            min={500000}
            max={1500000}
            step={10000}
            formatValue={(val) => formatRupiah(val)}
            onValueChange={(val) => updateField('max_budget', val)}
          />
        </div>

        {/* 3. Min PA% */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-700">{translations.minPa}</span>
            <span className="font-mono font-bold text-[#1A4D2E] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              ≥ {criteria.min_pa}%
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            {isEn ? 'Aroma intensity indicator (Export benchmark: 30%+)' : 'Penentu mutu aroma nilam (Standar ekspor: 30%+)'}
          </p>

          {/* Quick PA buttons */}
          <div className="flex gap-1.5 pt-0.5">
            {[
              { label: '28% (SNI)', val: 28 },
              { label: '30% (Ekspor)', val: 30 },
              { label: '32%+ (Super)', val: 32 }
            ].map((pa) => (
              <button
                key={pa.val}
                type="button"
                onClick={() => updateField('min_pa', pa.val)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                  criteria.min_pa === pa.val
                    ? 'bg-[#1A4D2E] text-white border-[#1A4D2E]'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
              >
                {pa.label}
              </button>
            ))}
          </div>

          <CustomSlider
            value={criteria.min_pa}
            min={26}
            max={38}
            step={0.5}
            unit="%"
            onValueChange={(val) => updateField('min_pa', val)}
          />
        </div>

        {/* 4. Max Moisture% */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-700">{translations.maxMoisture}</span>
            <span className="font-mono font-bold text-[#1A4D2E] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              ≤ {criteria.max_moisture}%
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            {isEn ? 'Purity level (Lower is better, ISO standard ≤ 3%)' : 'Tingkat kemurnian minyak (Standar mutu ≤ 3%)'}
          </p>

          {/* Quick moisture buttons */}
          <div className="flex gap-1.5 pt-0.5">
            {[
              { label: '≤ 2% (Murni)', val: 2 },
              { label: '≤ 3% (Standar)', val: 3 },
              { label: '≤ 5% (Umum)', val: 5 }
            ].map((m) => (
              <button
                key={m.val}
                type="button"
                onClick={() => updateField('max_moisture', m.val)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                  criteria.max_moisture === m.val
                    ? 'bg-[#1A4D2E] text-white border-[#1A4D2E]'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <CustomSlider
            value={criteria.max_moisture}
            min={1}
            max={6}
            step={0.5}
            unit="%"
            onValueChange={(val) => updateField('max_moisture', val)}
          />
        </div>

      </div>

      {/* Submit Action */}
      <div className="pt-4 border-t border-zinc-150 shrink-0 mt-3">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="w-full bg-[#1A4D2E] hover:bg-[#123320] text-white font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{translations.btnLoading}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{translations.btnSubmit}</span>
            </>
          )}
        </Button>
      </div>

    </div>
  );
}

export default CriteriaPanel;
