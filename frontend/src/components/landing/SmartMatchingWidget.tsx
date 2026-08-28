'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Search, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleNetwork } from '@/components/smart-matching/ParticleNetwork';

export function SmartMatchingWidget() {
  const locale = useLocale();
  const router = useRouter();
  const isId = locale === 'id';

  const [volume, setVolume] = useState(200);
  const [grade, setGrade] = useState<'A' | 'B' | 'C'>('A');
  const [budget, setBudget] = useState('850000');

  const handleSearchRedirect = () => {
    // Map Grades to corresponding target minimum PA percentages
    const minPa = grade === 'A' ? 30 : grade === 'B' ? 26 : 22;
    const cleanBudget = budget.replace(/[^0-9]/g, '') || '850000';

    // Redirect to smart matching workspace with preset query parameters
    router.push(`/${locale}/matching?volume=${volume}&min_pa=${minPa}&max_budget=${cleanBudget}`);
  };

  const formatRupiah = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    if (!num) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(Number(num))
      .replace('Rp', 'Rp ');
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setBudget(rawVal);
  };

  return (
    <section className="py-14 sm:py-20 md:py-24 bg-[#08130c] text-white relative overflow-hidden">
      {/* Background decoration gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(at 0% 0%, #064e3b40 0%, transparent 60%),
            radial-gradient(at 100% 100%, #78350f15 0%, transparent 50%)
          `
        }}
      />

      {/* Particle Network Background Mesh */}
      <ParticleNetwork />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Text Copy */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>⚡ {isId ? 'AI-POWERED MATCHING' : 'AI-POWERED MATCHING'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-serif leading-tight">
              {isId ? 'Temukan Supplier Terideal Instan' : 'Find the Most Ideal Supplier Instantly'}
            </h2>

            <p className="text-zinc-300 leading-relaxed max-w-lg font-light text-sm md:text-base">
              {isId
                ? 'Gunakan widget interaktif ini untuk memicu algoritma Smart Matching MCDM Valam. Sistem kami mencocokkan target volume dan budget Anda dengan CoA digital supplier real-time.'
                : 'Use this interactive widget to trigger Valam’s MCDM Smart Matching. We match your volume and budget requirements against real-time supplier digital CoA.'}
            </p>

            <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                {isId
                  ? 'Berdasarkan 154 supplier berlisensi distilasi modern.'
                  : 'Based on 154 licensed modern distillation suppliers.'}
              </span>
            </div>
          </div>

          {/* Right Mini Widget Form Card */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-emerald-950/40 backdrop-blur-xl border border-emerald-900/60 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
            >
              {/* Card Inner Decorative Glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <h3 className="text-lg font-bold font-serif mb-6 text-white text-center sm:text-left">
                {isId ? 'Berapa kebutuhan nilam Anda?' : 'What is your patchouli demand?'}
              </h3>

              <div className="space-y-6">
                {/* 1. Volume Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-emerald-300">
                    <span>{isId ? 'Target Volume' : 'Target Volume'}</span>
                    <span className="text-white font-sans text-sm font-bold bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                      {volume} kg
                    </span>
                  </div>

                  <div className="relative pt-2">
                    <input
                      type="range"
                      min="50"
                      max="5000"
                      step="50"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-semibold">
                      <span>50 kg</span>
                      <span>5,000 kg</span>
                    </div>
                  </div>
                </div>

                {/* 2. Grade Toggle */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block mb-1">
                    {isId ? 'Grade Nilam (Tingkat PA%)' : 'Patchouli Grade (PA%)'}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['A', 'B', 'C'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrade(g)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all duration-300 border uppercase
                          ${grade === g
                            ? 'bg-amber-500 border-amber-400 text-emerald-950 shadow-md shadow-amber-500/10'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                          }`}
                      >
                        {isId ? `Grade ${g}` : `Grade ${g}`}
                        <span className="block text-[9px] opacity-75 font-normal tracking-wide mt-0.5">
                          {g === 'A' ? 'PA ≥ 30%' : g === 'B' ? 'PA 26-29%' : 'PA < 26%'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Budget Text Input */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block mb-1">
                    {isId ? 'Anggaran Maksimum / Kg' : 'Maximum Budget / Kg'}
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={isId ? 'Contoh: Rp 850.000' : 'E.g., Rp 850.000'}
                      value={budget ? formatRupiah(budget) : ''}
                      onChange={handleBudgetChange}
                      className="w-full bg-zinc-900/60 border border-emerald-900/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-400 transition-colors"
                    />
                    <span className="absolute right-3.5 top-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      IDR/KG
                    </span>
                  </div>
                </div>

                {/* Submit Action Redirect */}
                <div className="pt-2">
                  <Button
                    onClick={handleSearchRedirect}
                    className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-emerald-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.01] transition-all duration-300 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer border border-amber-400/30"
                  >
                    <span>{isId ? 'Temukan Supplier Terbaik' : 'Find Best Suppliers'}</span>
                    <Search className="w-4 h-4" />
                  </Button>

                  <p className="text-[10px] text-center text-zinc-400 mt-3 font-medium">
                    {isId
                      ? '"Mencocokkan spesifikasi Anda dengan database CoA digital terverifikasi"'
                      : '"Matches your target specs against our database of verified digital CoAs"'}
                  </p>
                </div>

              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
