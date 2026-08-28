'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Leaf, Flame, Droplets, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CircularProductSection() {
  const locale = useLocale();
  const isId = locale === 'id';

  const content = {
    badge: isId ? 'EKONOMI SIRKULAR' : 'CIRCULAR ECONOMY',
    title: isId ? 'Zero-Waste & Produk Olahan Sampingan' : 'Zero-Waste & Valued Co-Products',
    subtitle: isId
      ? 'Kami mengolah 100% residu penyulingan daun nilam menjadi produk sekunder bernilai guna tinggi, mendukung pertanian berkelanjutan dan menjaga kelestarian lingkungan.'
      : 'We upcycle 100% of patchouli distillation residues into high-value agricultural co-products, championing sustainability and soil regeneration.',
    cta: isId ? 'Jelajahi Circular Marketplace' : 'Explore Circular Marketplace',
    
    products: [
      {
        icon: Leaf,
        title: isId ? 'Organic Compost' : 'Organic Compost',
        tag: isId ? '100% Organik' : '100% Organic',
        desc: isId
          ? 'Pupuk organik premium hasil dekomposisi fermentasi ampas daun dan batang nilam. Sangat kaya unsur hara makro untuk menyehatkan tanah perkebunan.'
          : 'Premium organic fertilizer fermented from patchouli leaf and stem residuals. Rich in macro-nutrients to restore soil fertility.',
        bgHover: 'group-hover:border-emerald-500/30 group-hover:shadow-emerald-950/[0.02]',
        iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      },
      {
        icon: Flame,
        title: isId ? 'Active Biochar' : 'Active Biochar',
        tag: isId ? 'Pembenah Tanah' : 'Soil Conditioner',
        desc: isId
          ? 'Karbon aktif hasil pirolisis lambat (slow pyrolysis) dari sisa ranting penyulingan nilam. Meningkatkan kapasitas retensi air dan porositas tanah.'
          : 'High-surface-area active carbon produced via slow pyrolysis of wood residues. Dramatically improves water retention and soil aeration.',
        bgHover: 'group-hover:border-amber-500/30 group-hover:shadow-amber-950/[0.02]',
        iconBg: 'bg-amber-50 text-amber-700 border-amber-100',
      },
      {
        icon: Droplets,
        title: isId ? 'Patchouli Hydrosol' : 'Patchouli Hydrosol',
        tag: isId ? 'Bahan Baku Kosmetik' : 'Cosmetic Raw Material',
        desc: isId
          ? 'Air destilasi murni hasil kondensasi uap minyak nilam. Mengandung molekul aktif menenangkan untuk sabun organik, toner, dan antiseptik alami.'
          : 'Pure steam distillate water co-produced during extraction. Retains soothing botanical active compounds ideal for organic skincare and soaps.',
        bgHover: 'group-hover:border-blue-500/30 group-hover:shadow-blue-950/[0.02]',
        iconBg: 'bg-blue-50 text-blue-700 border-blue-100',
      }
    ]
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <section className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-20 bg-white border-t border-b border-zinc-100 relative overflow-hidden">
      {/* Decorative leaf blur background element */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold tracking-wider uppercase"
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-700" />
            {content.badge}
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold font-sans text-zinc-900 leading-tight"
          >
            {content.title}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-zinc-650 leading-relaxed max-w-2xl mx-auto font-light"
          >
            {content.subtitle}
          </motion.p>
        </div>

        {/* 3 Column Grid Cards */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-16"
        >
          {content.products.map((p, idx) => {
            const IconComponent = p.icon;
            return (
              <motion.div 
                key={idx}
                variants={fadeInUp}
                className={`bg-zinc-50 rounded-3xl p-8 border border-zinc-150/70 hover:border-emerald-600/30 hover:bg-white shadow-md hover:shadow-xl group hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between`}
              >
                <div className="space-y-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${p.iconBg} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="inline-block text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150/50 uppercase tracking-wider">
                      {p.tag}
                    </span>
                    <h3 className="text-xl font-bold text-zinc-900 leading-tight group-hover:text-emerald-800 transition-colors">
                      {p.title}
                    </h3>
                  </div>
                  
                  <p className="text-zinc-650 text-xs md:text-sm leading-relaxed font-light">
                    {p.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Action Button */}
        <div className="text-center">
          <Link href={`/${locale}/marketplace?tab=circular`}>
            <Button 
              size="lg"
              className="h-12 px-8 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl shadow-md border-0 transition-all font-semibold gap-2 group"
            >
              {content.cta}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
