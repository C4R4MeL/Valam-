'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SlidersHorizontal, Search } from 'lucide-react';
import { CustomSlider } from './CustomSlider';
import { formatRupiah } from '@/lib/utils';

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
  loading,
  locale,
  translations,
}: CriteriaPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const isEn = locale === 'en';
  
  // Track interaction to enable matching button with pulse animation
  const [interactedSliders, setInteractedSliders] = useState<Record<string, boolean>>({
    volume: false,
    budget: false,
    pa: false,
    moisture: false,
  });

  const handleSliderChange = (key: keyof Criteria, value: number, name: string) => {
    onCriteriaChange({
      ...criteria,
      [key]: value,
    });
    setInteractedSliders((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const allSlidersSet = Object.values(interactedSliders).every(v => v === true);

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, x: -40 }}
      whileInView={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-surface-900 rounded-3xl border border-surface-700 p-5 shadow-2xl shadow-surface-950/50 flex flex-col justify-between lg:h-full h-auto overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 border-b border-surface-700 pb-3 shrink-0">
        <SlidersHorizontal className="w-5 h-5 text-glow-forest" />
        <h3 className="text-base font-bold text-warm-50 font-sans">
          {translations.title}
        </h3>
      </div>

      {/* Sliders Container */}
      <div className="space-y-4 lg:space-y-3 flex-1 flex flex-col justify-between">
        
        {/* Volume */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-warm-200 text-xs font-bold">{translations.volume}</span>
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${interactedSliders.volume ? 'bg-forest-500/20 text-glow-forest border border-forest-500/30' : 'bg-surface-800 text-warm-400'}`}>
              {interactedSliders.volume ? (isEn ? 'SET' : 'DIATUR') : (isEn ? 'DEFAULT' : 'STANDAR')}
            </span>
          </div>
          <CustomSlider
            value={criteria.volume_kg}
            min={1}
            max={1000}
            step={10}
            unit=" Kg"
            onValueChange={(val) => handleSliderChange('volume_kg', val, 'volume')}
          />
        </div>

        {/* Budget */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-warm-200 text-xs font-bold">{translations.budget}</span>
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${interactedSliders.budget ? 'bg-forest-500/20 text-glow-forest border border-forest-500/30' : 'bg-surface-800 text-warm-400'}`}>
              {interactedSliders.budget ? (isEn ? 'SET' : 'DIATUR') : (isEn ? 'DEFAULT' : 'STANDAR')}
            </span>
          </div>
          <CustomSlider
            value={criteria.max_budget}
            min={500000}
            max={1500000}
            step={10000}
            formatValue={(val) => formatRupiah(val)}
            onValueChange={(val) => handleSliderChange('max_budget', val, 'budget')}
          />
        </div>

        {/* Min PA% */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-warm-200 text-xs font-bold">{translations.minPa}</span>
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${interactedSliders.pa ? 'bg-forest-500/20 text-glow-forest border border-forest-500/30' : 'bg-surface-800 text-warm-400'}`}>
              {interactedSliders.pa ? (isEn ? 'SET' : 'DIATUR') : (isEn ? 'DEFAULT' : 'STANDAR')}
            </span>
          </div>
          <CustomSlider
            value={criteria.min_pa}
            min={25}
            max={40}
            step={0.5}
            unit="%"
            onValueChange={(val) => handleSliderChange('min_pa', val, 'pa')}
          />
        </div>

        {/* Max Moisture% */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-warm-200 text-xs font-bold">{translations.maxMoisture}</span>
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${interactedSliders.moisture ? 'bg-forest-500/20 text-glow-forest border border-forest-500/30' : 'bg-surface-800 text-warm-400'}`}>
              {interactedSliders.moisture ? (isEn ? 'SET' : 'DIATUR') : (isEn ? 'DEFAULT' : 'STANDAR')}
            </span>
          </div>
          <CustomSlider
            value={criteria.max_moisture}
            min={1}
            max={10}
            step={0.5}
            unit="%"
            onValueChange={(val) => handleSliderChange('max_moisture', val, 'moisture')}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 shrink-0">
          <button
            onClick={onSubmit}
            disabled={loading}
            className={`w-full h-11 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 select-none border-none
              ${loading
                ? 'bg-surface-800 text-warm-400 cursor-not-allowed border border-surface-700'
                : 'bg-gradient-to-r from-gold-500 to-gold-300 hover:from-gold-400 hover:to-gold-200 text-forest-950 shadow-lg shadow-gold-500/10 hover:shadow-gold-500/20 hover:scale-[1.02] cursor-pointer border border-gold-300/30 font-extrabold'
              }`}
          >
            {loading ? translations.btnLoading : translations.btnSubmit}
            {!loading && <Search className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </motion.div>
  );
}

export default CriteriaPanel;
