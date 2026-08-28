'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Clock, TrendingUp } from 'lucide-react';

export function InsightsTeaser() {
  const locale = useLocale();
  const isId = locale === 'id';

  // Fallback data for the teaser
  const featuredArticle = {
    title: isId 
      ? "Masa Depan Ekspor Nilam Aceh di Pasar Fragrance Global" 
      : "The Future of Aceh Patchouli Exports in Global Fragrance Markets",
    slug: "masa-depan-ekspor-nilam-aceh-di-pasar-fragrance-global",
    desc: isId 
      ? "Bagaimana tuntutan keberlanjutan dan ketertelusuran digital mendefinisikan ulang kemitraan dengan rumah wewangian Paris." 
      : "How sustainability and digital traceability are redefining partnerships with perfume houses in Paris.",
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&h=600&fit=crop",
    date: "03 Jul 2026",
    readTime: "5 min"
  };

  const smallArticles = [
    {
      title: isId 
        ? "Mengapa Kadar Patchouli Alcohol (PA) Menentukan Harga Nilam Anda?" 
        : "Why Patchouli Alcohol (PA) Percentage Dictates Market Value?",
      slug: "mengapa-kadar-patchouli-alcohol-pa-menentukan-harga-nilam-anda",
      image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=300&fit=crop",
      date: "01 Jul 2026",
      readTime: "3 min"
    },
    {
      title: isId 
        ? "Inovasi Alat Penyulingan Uap Bersih Terintegrasi di Aceh Lues" 
        : "Clean Steam Distillation Technology Innovations in Aceh Lues",
      slug: "inovasi-alat-penyulingan-uap-bersih-terintegrasi-di-aceh-lues",
      image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=300&fit=crop",
      date: "28 Jun 2026",
      readTime: "4 min"
    }
  ];

  return (
    <section className="py-14 sm:py-20 md:py-24 bg-zinc-50/80 relative overflow-hidden border-t border-zinc-100">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4">
          <div className="space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>{isId ? 'VALAM INSIGHTS' : 'VALAM INSIGHTS'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-zinc-900 tracking-tight leading-tight">
              {isId ? 'Tetap Terdepan di Industri Nilam' : 'Stay Ahead in the Patchouli Industry'}
            </h2>
          </div>
          <Link href={`/${locale}/insights`} className="inline-block self-start md:self-auto">
            <Button variant="outline" className="border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-medium gap-2 rounded-xl text-xs sm:text-sm">
              <span>{isId ? 'Baca Semua Insights' : 'Read All Insights'}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </Link>
        </div>

        {/* Magazine Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Featured Article */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 flex flex-col justify-between border border-zinc-200 rounded-3xl bg-zinc-50 overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
          >
            <Link href={`/${locale}/insights/${featuredArticle.slug}`} className="flex flex-col h-full">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image 
                  src={featuredArticle.image} 
                  alt={featuredArticle.title} 
                  fill 
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4 text-white text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{featuredArticle.date}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{featuredArticle.readTime}</span>
                </div>
              </div>
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-xl md:text-2xl font-bold font-serif text-zinc-900 leading-tight group-hover:text-emerald-800 transition-colors">
                    {featuredArticle.title}
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed font-light">
                    {featuredArticle.desc}
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider group-hover:gap-2.5 transition-all">
                  <span>{isId ? 'Baca Selengkapnya' : 'Read Article'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Right Column: Small Articles Stack + Live Price Widget */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            
            {/* Small Articles stack */}
            <div className="space-y-6 flex-1">
              {smallArticles.map((article, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="border border-zinc-200 rounded-3xl p-5 hover:shadow-md transition-all bg-white group cursor-pointer"
                >
                  <Link href={`/${locale}/insights/${article.slug}`} className="flex gap-4 items-center">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0">
                      <Image src={article.image} alt={article.title} fill className="object-cover" />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold font-serif text-zinc-900 leading-snug group-hover:text-emerald-800 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-3 text-zinc-400 text-[10px] font-semibold">
                        <span>{article.date}</span>
                        <span>•</span>
                        <span>{article.readTime} read</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Premium Live Price Widget */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-emerald-950 border border-emerald-900/60 p-5 rounded-3xl shadow-xl relative overflow-hidden"
            >
              {/* Decorative radial overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-emerald-900/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                      {isId ? 'Harga Nilam Terkini' : 'Live Patchouli Prices'}
                    </h5>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                      {isId ? 'Rata-rata Pasar Terverifikasi' : 'Verified Average Market'}
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Live</span>
                </div>
              </div>

              {/* Price list */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/[0.03] border border-white/[0.05] p-3 rounded-2xl">
                  <div className="text-[10px] text-zinc-400 font-semibold mb-1">Grade A</div>
                  <div className="text-sm font-bold text-amber-400">Rp 850k</div>
                  <div className="text-[8px] text-emerald-400 font-bold mt-0.5">↑ +2.5%</div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] p-3 rounded-2xl">
                  <div className="text-[10px] text-zinc-400 font-semibold mb-1">Grade B</div>
                  <div className="text-sm font-bold text-zinc-100">Rp 780k</div>
                  <div className="text-[8px] text-emerald-400 font-bold mt-0.5">↑ +1.8%</div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] p-3 rounded-2xl">
                  <div className="text-[10px] text-zinc-400 font-semibold mb-1">Grade C</div>
                  <div className="text-sm font-bold text-zinc-400">Rp 680k</div>
                  <div className="text-[8px] text-zinc-400 font-semibold mt-0.5">Stable</div>
                </div>
              </div>
            </motion.div>

          </div>

        </div>

        {/* Mobile Read All button */}
        <div className="mt-8 text-center md:hidden">
          <Link href={`/${locale}/insights`}>
            <Button variant="outline" className="w-full border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-semibold gap-2 rounded-xl">
              <span>{isId ? 'Baca Semua Insights' : 'Read All Insights'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
