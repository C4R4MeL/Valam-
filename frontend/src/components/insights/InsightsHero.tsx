'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, Layers, BookOpen, TrendingUp, Users, Calendar, Globe } from 'lucide-react';
import { fadeUp, stagger } from '@/lib/animations';
import { ParticleNetwork } from '@/components/smart-matching/ParticleNetwork';

interface InsightsHeroProps {
  locale: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: string | null;
  setActiveTab: (tab: any) => void;
  setPage: (page: number) => void;
  stats: {
    articles: number;
    guides: number;
    stories: number;
    weeks: number;
    countries: number;
  };
}

const TABS = [
  { key: null, labelId: 'Semua', labelEn: 'All', icon: Layers },
  { key: 'artikel', labelId: 'Artikel', labelEn: 'Articles', icon: BookOpen },
  { key: 'panduan', labelId: 'Panduan', labelEn: 'Guides', icon: TrendingUp },
  { key: 'cerita_koperasi', labelId: 'Cerita Koperasi', labelEn: 'Cooperative Stories', icon: Users },
];

const ROTATION_WORDS = [
  { text: 'Insights', color: 'text-amber-500' },
  { text: 'Wawasan', color: 'text-emerald-400' },
  { text: 'Knowledge', color: 'text-white' },
];

function StatCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setCount(value);
      return;
    }
    let start = 0;
    const end = value;
    if (start === end) return;
    const duration = 1200;
    const stepTime = Math.max(Math.floor(duration / end), 20);
    const timer = setInterval(() => {
      start += 1;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value, prefersReducedMotion]);

  return <span>{count}</span>;
}

export function InsightsHero({
  locale,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  setPage,
  stats,
}: InsightsHeroProps) {
  const isEn = locale === 'en';
  const [wordIndex, setWordIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATION_WORDS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [prefersReducedMotion]);

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden bg-[#0a1a0f]">
      {/* 3% Opacity Noise Texture Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial Gradient Mesh */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(at 0% 0%, #064e3b 0%, transparent 60%),
            radial-gradient(at 100% 50%, #78350f20 0%, transparent 50%)
          `
        }}
      />

      {/* Particle Network Canvas Background */}
      <ParticleNetwork />

      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-20">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
          
          {/* Badge Pill */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">
              {isEn ? 'Knowledge Hub' : 'Pusat Pengetahuan'}
            </span>
          </motion.div>

          {/* Heading with Word Rotation */}
          <motion.h1 
            variants={fadeUp} 
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight font-serif"
          >
            Valam{' '}
            <span className="inline-block min-w-[200px] text-left">
              {prefersReducedMotion ? (
                <span className="text-amber-500">Insights</span>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={ROTATION_WORDS[wordIndex].text}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className={`inline-block font-sans ${ROTATION_WORDS[wordIndex].color}`}
                  >
                    {ROTATION_WORDS[wordIndex].text}
                  </motion.span>
                </AnimatePresence>
              )}
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p 
            variants={fadeUp} 
            className="text-sm md:text-base text-white/60 max-w-lg mx-auto leading-relaxed"
          >
            {isEn
              ? 'Premium editorial & regulatory wawasan for the Indonesian patchouli essential oil value chain.'
              : 'Pusat wawasan premium & regulasi industri minyak nilam nusantara terpercaya.'}
          </motion.p>

          {/* Search Bar */}
          <motion.div variants={fadeUp} className="max-w-xl mx-auto pt-2">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-400 transition-colors" />
              <input
                id="insights-search"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={isEn ? 'Search articles, guides...' : 'Cari artikel, panduan...'}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-800/50 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all shadow-lg"
              />
            </div>
          </motion.div>

          {/* Category Tabs */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key || 'all'}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setPage(1);
                    setSearchQuery('');
                  }}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-zinc-900 shadow-lg scale-105'
                      : 'bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1] hover:text-white border border-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {isEn ? tab.labelEn : tab.labelId}
                </button>
              );
            })}
          </motion.div>

          {/* Enhanced Glassmorphic Stats Container */}
          <motion.div 
            variants={fadeUp} 
            className="grid grid-cols-2 md:grid-cols-5 gap-6 p-6 md:p-8 mt-12 bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-3xl max-w-5xl mx-auto shadow-2xl relative group/stats"
          >
            {/* Ambient gold glow behind stats container on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-emerald-500/0 rounded-3xl opacity-0 group-hover/stats:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {[
              { label: isEn ? 'Articles' : 'Artikel', val: stats.articles, icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
              { label: isEn ? 'Guides' : 'Panduan', val: stats.guides, icon: TrendingUp, color: 'text-[#B69A1D]', bg: 'bg-[#B69A1D]/20' },
              { label: isEn ? 'Stories' : 'Cerita Koperasi', val: stats.stories, icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/20' },
              { label: isEn ? 'Active Weeks' : 'Minggu Aktif', val: stats.weeks, icon: Calendar, color: 'text-emerald-300', bg: 'bg-emerald-400/20' },
              { label: isEn ? 'Read Regions' : 'Negara Pembaca', val: stats.countries, icon: Globe, color: 'text-teal-300', bg: 'bg-teal-500/20' },
            ].map((stat, idx) => {
              const StatIcon = stat.icon;
              return (
                <div 
                  key={idx} 
                  className="flex flex-col items-center justify-center relative p-4 rounded-2xl hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 group/item"
                >
                  {/* Floating Icon Circle */}
                  <div className={`p-2.5 rounded-full ${stat.bg} mb-3 border border-white/10 group-hover/item:scale-110 transition-all`}>
                    <StatIcon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  
                  {/* Big Counter Value */}
                  <div className="text-3xl md:text-4xl font-extrabold text-white font-mono tracking-tight">
                    <StatCounter value={stat.val} />
                  </div>
                  
                  {/* Label */}
                  <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mt-2 text-center">
                    {stat.label}
                  </div>
                  
                  {/* Separators */}
                  {idx < 4 && (
                    <div className="hidden md:block absolute right-[-12px] top-1/2 -translate-y-1/2 h-12 w-[1px] bg-white/10 pointer-events-none" />
                  )}
                </div>
              );
            })}
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
