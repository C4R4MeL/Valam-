'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Zap, Target, Timer } from 'lucide-react';
import { ParticleNetwork } from './ParticleNetwork';

interface SmartMatchingHeroProps {
  badge: string;
  title: string;
  subtitle: string;
  btnStart: string;
  onScrollToForm: () => void;
  locale: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] },
  }),
};

const slideRight = {
  hidden: { opacity: 0, x: 60 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: 0.5 + i * 0.15, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function SmartMatchingHero({
  badge, title, subtitle, btnStart, onScrollToForm, locale,
}: SmartMatchingHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const isEn = locale === 'en';

  const metrics = [
    { icon: Zap, value: '500+', label: isEn ? 'Verified CoA Batch' : 'Batch CoA Terverifikasi' },
    { icon: Target, value: '99.2%', label: isEn ? 'Match Accuracy' : 'Akurasi Kecocokan' },
    { icon: Timer, value: '< 3s', label: isEn ? 'Processing Time' : 'Waktu Proses' },
  ];

  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-36 md:pb-28 bg-surface-950"
      style={{
        background: `
          radial-gradient(ellipse at 0% 0%, rgba(31,92,70,0.4), transparent 60%),
          radial-gradient(ellipse at 100% 50%, rgba(184,134,11,0.1), transparent 50%),
          #0A1410
        `,
      }}
    >
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Particle network background */}
      <ParticleNetwork />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="lg:col-span-3 space-y-6 text-center lg:text-left">
            <motion.div
              custom={0}
              variants={prefersReducedMotion ? {} : fadeUp}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-2 bg-forest-500/10 border border-forest-500/20 text-glow-forest px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-glow-forest animate-pulse" />
              {badge}
            </motion.div>

            <motion.h1
              custom={1}
              variants={prefersReducedMotion ? {} : fadeUp}
              initial="hidden"
              animate="visible"
              className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-warm-50 leading-[1.1] tracking-tight"
            >
              {title}
            </motion.h1>

            <motion.p
              custom={2}
              variants={prefersReducedMotion ? {} : fadeUp}
              initial="hidden"
              animate="visible"
              className="text-warm-200 text-base sm:text-lg max-w-xl leading-relaxed mx-auto lg:mx-0 font-medium"
            >
              {subtitle}
            </motion.p>

            <motion.div
              custom={3}
              variants={prefersReducedMotion ? {} : fadeUp}
              initial="hidden"
              animate="visible"
            >
              <button
                onClick={onScrollToForm}
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-gold-500 to-gold-300 hover:from-gold-400 hover:to-gold-200 text-forest-950 font-bold px-8 py-4 rounded-2xl text-sm shadow-lg shadow-gold-500/10 hover:shadow-gold-500/20 hover:scale-[1.03] transition-all duration-300 border-none"
              >
                {btnStart}
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>

          {/* Right: Floating metric cards */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {metrics.map((m, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={prefersReducedMotion ? {} : slideRight}
                initial="hidden"
                animate="visible"
                className="flex items-center gap-4 bg-surface-900 border border-surface-700 rounded-2xl px-5 py-4 hover:bg-surface-800 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-forest-500/10 flex items-center justify-center shrink-0">
                  <m.icon className="w-5 h-5 text-glow-forest" />
                </div>
                <div>
                  <p className="text-2xl font-black text-warm-50 leading-none">{m.value}</p>
                  <p className="text-xs text-warm-200 font-medium mt-1">{m.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SmartMatchingHero;
