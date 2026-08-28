"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLocale } from "next-intl";
import { landingContent } from "./pageContent";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PriceSection } from "@/components/landing/PriceSection";
import { SupplierProofSection } from "@/components/landing/SupplierProofSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { SmartMatchingWidget } from "@/components/landing/SmartMatchingWidget";
import { CircularProductSection } from "@/components/landing/CircularProductSection";
import { InsightsTeaser } from "@/components/landing/InsightsTeaser";
import { FAQSection } from "@/components/landing/FAQSection";

/* ── Animated counter hook ── */
function useCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, start: () => setStarted(true) };
}

/* ── Icons ── */
function IconShield({ className }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>; }
function IconMap({ className }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" /></svg>; }
function IconTrending({ className }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>; }
function IconArrowRight({ className }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>; }
function IconGlobe({ className }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>; }


const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export default function Home() {
  const locale = useLocale();
  const isId = locale === "id";
  const content = landingContent[locale as keyof typeof landingContent] || landingContent.en;
  
  const suppliersCounter = useCounter(154);
  const destinationsCounter = useCounter(28);
  const verifiedCounter = useCounter(4320);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % content.heroSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [content.heroSlides.length]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* ═══════════════════ HERO SECTION ═══════════════════ */}
        <section className="relative w-full min-h-[calc(100vh-80px)] flex flex-col justify-center pt-28 pb-20 overflow-hidden">
          {/* Background Image Carousel */}
          {content.heroSlides.map((slide, index) => (
            <div 
              key={index}
              className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100' : 'opacity-0'}`}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover blur-[2px] scale-105"
                priority={index === 0}
              />
              {/* Overlay for text readability */}
              <div className="absolute inset-0 bg-emerald-950/65 mix-blend-multiply" />
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/75 to-transparent h-32" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-50 via-zinc-50/40 to-transparent h-[60%]" />
            </div>
          ))}

          {/* Floating Gold Particles Animation */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[25%] left-[12%] w-2 h-2 rounded-full bg-gold-400 opacity-60 blur-[1px] animate-float" style={{ animationDuration: '9s' }} />
            <div className="absolute top-[65%] left-[20%] w-3.5 h-3.5 rounded-full bg-emerald-400 opacity-40 blur-[1.5px] animate-float-slow" style={{ animationDuration: '14s' }} />
            <div className="absolute top-[35%] right-[15%] w-3 h-3 rounded-full bg-gold-300 opacity-55 blur-[1px] animate-float" style={{ animationDuration: '11s', animationDelay: '3s' }} />
            <div className="absolute top-[75%] right-[25%] w-2 h-2 rounded-full bg-amber-400 opacity-70 blur-[0.5px] animate-float-slow" style={{ animationDuration: '8s', animationDelay: '1s' }} />
            <div className="absolute top-[45%] left-[45%] w-1.5 h-1.5 rounded-full bg-emerald-300 opacity-50 blur-[0.5px] animate-float-slow" style={{ animationDuration: '12s', animationDelay: '2s' }} />
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl animate-float z-0 pointer-events-none" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

          <div className="container relative z-10 px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-6 text-center max-w-4xl mx-auto min-h-[300px] md:min-h-[340px] justify-center mt-8 md:mt-0">
              
              {/* Dynamic Content wrapper with key to trigger animation on slide change */}
              <div key={currentSlide} className="flex flex-col items-center space-y-6 animate-fade-up">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-100 text-sm font-medium backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                  {content.heroSlides[currentSlide].badge}
                </div>

                {/* Headline - Serif Luxury */}
                <h1 className="text-4xl font-serif font-medium sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight leading-[1.1] pb-2">
                  {content.heroSlides[currentSlide].title}{" "}
                  <span className="font-sans italic gradient-text-gold inline-block mt-2 pb-3 pr-2 font-light">
                    {content.heroSlides[currentSlide].highlight}
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="mx-auto max-w-[700px] text-base md:text-lg text-zinc-200 leading-relaxed font-sans font-light">
                  {content.heroSlides[currentSlide].subtitle}
                </p>
              </div>

              {/* Carousel Indicators */}
              <div className="flex gap-3 mt-4">
                {content.heroSlides.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-8 bg-gold-400' : 'w-4 bg-white/30 hover:bg-white/50'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 animate-fade-up" style={{ animationDelay: "0.3s" }}>
                <Link href={`/${locale}/marketplace`}>
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 border border-emerald-600 transition-all duration-300 hover:translate-y-[-1px] font-semibold"
                  >
                    {content.buttons.searchOil}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/register`}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 text-base bg-white/5 border border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-300 hover:translate-y-[-1px]"
                  >
                    {content.buttons.startSupplier}
                  </Button>
                </Link>
              </div>

            </div>

            {/* Floating Stats Bar */}
            <motion.div
              onViewportEnter={() => { suppliersCounter.start(); destinationsCounter.start(); verifiedCounter.start(); }}
              className="mt-8 w-full max-w-3xl mx-auto rounded-2xl p-6 shadow-2xl shadow-emerald-950/30 animate-fade-up bg-emerald-950/45 backdrop-blur-lg border border-emerald-800/30"
              style={{ animationDelay: "0.5s" }}
            >
              <div className="grid grid-cols-3 divide-x divide-emerald-800/50">
                <div className="flex flex-col items-center px-4">
                  <span className="text-3xl md:text-4xl font-bold text-white">
                    {suppliersCounter.count}+
                  </span>
                  <span className="text-xs md:text-sm text-emerald-100/70 mt-1 uppercase tracking-widest text-center">
                    {content.stats.suppliers}
                  </span>
                </div>
                <div className="flex flex-col items-center px-4">
                  <span className="text-3xl md:text-4xl font-bold text-white">
                    {destinationsCounter.count}
                  </span>
                  <span className="text-xs md:text-sm text-emerald-100/70 mt-1 uppercase tracking-widest text-center">
                    {content.stats.destinations}
                  </span>
                </div>
                <div className="flex flex-col items-center px-4">
                  <span className="text-3xl md:text-4xl font-bold text-white">
                    {verifiedCounter.count.toLocaleString()}
                  </span>
                  <span className="text-xs md:text-sm text-emerald-100/70 mt-1 uppercase tracking-widest text-center">
                    {content.stats.verified}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* VISION SECTION - Asymmetrical Layout */}
        <section className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-20 bg-white relative overflow-hidden">
          <div className="container mx-auto px-6 md:px-8 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
                className="lg:col-span-5 space-y-6"
              >
                <div className="space-y-4">
                  <motion.div variants={fadeInUp} className="text-emerald-600 font-semibold tracking-wider text-xs uppercase">{content.vision.badge}</motion.div>
                  <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold font-sans text-zinc-900 leading-tight">
                    {content.vision.title1} <span className="text-emerald-600">{content.vision.titleHighlight}</span> {content.vision.title2}
                  </motion.h2>
                </div>
                <motion.p variants={fadeInUp} className="text-base md:text-lg text-zinc-600 leading-relaxed font-light">
                  {isId 
                    ? "Indonesia menyuplai 90% kebutuhan minyak nilam dunia. Komoditas ini merupakan bahan pengikat aroma parfum mewah. Valam hadir untuk menghubungkan petani langsung ke pasar ekspor dengan standar mutu terjamin."
                    : "Indonesia supplies 90% of global patchouli oil. This essential oil is the primary fixative for luxury perfumery. Valam connects local cooperatives directly with global buyers under fair pricing."}
                </motion.p>

                {/* Inline Mini Stats */}
                <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-200">
                  <div>
                    <div className="text-2xl md:text-3xl font-extrabold text-emerald-700">90%</div>
                    <div className="text-xs text-zinc-500 mt-1 leading-snug">
                      {isId ? "Pasokan Dunia dari Indonesia" : "World Supply from Indonesia"}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-extrabold text-emerald-700">28</div>
                    <div className="text-xs text-zinc-500 mt-1 leading-snug">
                      {isId ? "Negara Tujuan Ekspor" : "Export Destinations"}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-extrabold text-emerald-700">{isId ? "Rp 450k" : "IDR 450k"}</div>
                    <div className="text-xs text-zinc-500 mt-1 leading-snug">
                      {isId ? "Harga Grade A / Kg" : "Grade A Price / Kg"}
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="pt-2">
                  <Link href={`/${locale}/marketplace`} className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800 transition-colors group">
                    {content.vision.cta}
                    <IconArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}
                className="lg:col-span-7 relative"
              >
                <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xl relative">
                  <Image 
                    src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=600&fit=crop" 
                    alt="Patchouli Harvest" 
                    fill 
                    className="object-cover" 
                  />
                </div>
                {/* Repositioned Floating MCDM Card */}
                <div className="absolute -bottom-6 -right-6 bg-white p-5 rounded-2xl shadow-lg border border-zinc-100/80 max-w-xs hidden md:block z-10">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <IconTrending className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">{isId ? "Sistem Cerdas" : "Smart Matching"}</div>
                      <div className="font-bold text-sm text-zinc-900">{isId ? "Pencocokan Presisi" : "Precision Matching"}</div>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {isId 
                      ? "Rekomendasi supplier berdasarkan kecocokan volume, budget, dan kadar PA terbaik."
                      : "Recommendations based on optimal volume, budget, and PA matching."}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ENHANCED FEATURES SECTION - Redesigned Grid */}
        <section className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-20 bg-zinc-50 relative overflow-hidden">
          <div className="container mx-auto px-6 md:px-8 max-w-7xl relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <motion.div variants={fadeInUp} className="inline-block px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold tracking-widest uppercase">
                {content.features.badge}
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold font-sans text-zinc-900 leading-tight">
                {content.features.title} <span className="text-emerald-600">{content.features.titleHighlight}</span>
              </h2>
              <p className="text-base md:text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto font-light">
                {content.features.desc}
              </p>
            </div>

            <div className="space-y-6 md:space-y-8">
              {/* Row 1: 2 Large Cards with Background Images */}
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
              >
                {/* Large Card 1: MCDM Smart Matching */}
                <motion.div variants={fadeInUp} className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-zinc-100 hover:border-emerald-600/30 group hover:-translate-y-1.5 transition-all duration-300">
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden">
                    <Image src="/images/b2b_dashboard.png" alt="MCDM Smart Matching" fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/95 via-zinc-900/40 to-transparent" />
                    <div className="absolute bottom-6 left-6 flex items-center gap-3 text-white">
                       <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg border border-emerald-400">
                         <IconTrending className="w-5 h-5 text-white" />
                       </div>
                       <h3 className="text-xl sm:text-2xl font-bold">{isId ? "MCDM Smart Matching" : "MCDM Smart Matching"}</h3>
                    </div>
                  </div>
                  <div className="p-6 sm:p-8">
                    <p className="text-zinc-600 leading-relaxed text-sm md:text-base">
                      {isId 
                        ? "Sistem cerdas yang secara otomatis mencocokkan profil Volume, Budget, dan kadar PA% Anda dengan supplier paling ideal."
                        : "An intelligent system that automatically matches your volume, budget, and PA% requirements with the most ideal suppliers."}
                    </p>
                  </div>
                </motion.div>

                {/* Large Card 2: Lab-Verified CoA */}
                <motion.div variants={fadeInUp} className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-zinc-100 hover:border-emerald-600/30 group hover:-translate-y-1.5 transition-all duration-300">
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden">
                    <Image src="/images/lab_test.png" alt="Lab-Verified CoA" fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/95 via-zinc-900/40 to-transparent" />
                    <div className="absolute bottom-6 left-6 flex items-center gap-3 text-white">
                       <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg border border-emerald-400">
                         <IconShield className="w-5 h-5 text-white" />
                       </div>
                       <h3 className="text-xl sm:text-2xl font-bold">{isId ? "Lab-Verified CoA" : "Lab-Verified CoA"}</h3>
                    </div>
                  </div>
                  <div className="p-6 sm:p-8">
                    <p className="text-zinc-600 leading-relaxed text-sm md:text-base">
                      {isId 
                        ? "Setiap batch minyak nilam diuji di laboratorium terakreditasi. Anda menerima hasil nyata, bukan sekadar janji."
                        : "Every batch of patchouli oil is tested in an accredited laboratory. You receive real results, not just promises."}
                    </p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Row 2: 3 Small Cards without Cover Images */}
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
              >
                {/* Small Card 1: Traceability */}
                <motion.div variants={fadeInUp} className="bg-white rounded-3xl p-8 border border-zinc-100 hover:border-emerald-600/30 shadow-md hover:shadow-xl group hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                      <IconMap className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-zinc-900">{isId ? "Keterlacakan 100%" : "100% Traceability"}</h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">
                      {isId
                        ? "Lacak perjalanan minyak nilam secara transparan dari kebun petani hingga pelabuhan."
                        : "Track your patchouli oil transparently from farmers' fields to the export port."}
                    </p>
                  </div>
                </motion.div>

                {/* Small Card 2: Live RFQ */}
                <motion.div variants={fadeInUp} className="bg-white rounded-3xl p-8 border border-zinc-100 hover:border-emerald-600/30 shadow-md hover:shadow-xl group hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                      <IconGlobe className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-zinc-900">{isId ? "Negosiasi Live RFQ" : "Live RFQ Negotiation"}</h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">
                      {isId
                        ? "Kirim permintaan penawaran harga, tawar-menawar, dan kunci kontrak langsung di platform."
                        : "Submit requests for quotation, negotiate prices, and lock contracts directly on the platform."}
                    </p>
                  </div>
                </motion.div>

                {/* Small Card 3: Escrow (NEW) */}
                <motion.div variants={fadeInUp} className="bg-white rounded-3xl p-8 border border-zinc-100 hover:border-emerald-600/30 shadow-md hover:shadow-xl group hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-emerald-600 text-white font-semibold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {isId ? "Baru" : "New"}
                  </div>
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                      <IconShield className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-zinc-900">{isId ? "Escrow & Pembayaran Aman" : "Secure Escrow Payment"}</h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">
                      {isId
                        ? "Dana transaksi disimpan aman dalam rekening bersama dan cair setelah produk lolos pengujian lab QC."
                        : "Transaction funds are held securely in escrow and only released after goods pass QC verification."}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION BARU 1 — Harga Nilam Hari Ini */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <PriceSection />
        </motion.div>

        {/* HOOK 1 — Smart Matching: "Coba Sekarang" Mini Widget */}
        <SmartMatchingWidget />

        {/* SECTION BARU 3 — Circular Economy & Waste Upcycling */}
        <CircularProductSection />

        {/* SECTION BARU 2 — Social Proof Koperasi */}
        <SupplierProofSection />

        {/* TESTIMONI SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <TestimonialsSection />
        </motion.div>

        {/* HOOK 2 — Insights: Editorial Teaser Section */}
        <InsightsTeaser />

        {/* CTA SECTION */}
        <section className="pt-20 md:pt-28 pb-6 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-50/50" />
          <div className="container relative mx-auto px-6 md:px-8 max-w-4xl text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-zinc-900 mb-6"
            >
              {content.cta.title1} <span className="text-emerald-600">{content.cta.titleHighlight}</span> {content.cta.title2}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="text-xl text-zinc-600 mb-10"
            >
              {content.cta.desc}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Button asChild size="lg" className="h-14 px-8 text-base bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg border-0">
                <Link href={`/${locale}/register`}>{content.cta.supplierButton}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base rounded-xl bg-white">
                <Link href={`/${locale}/register`}>{content.cta.buyerButton}</Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <FAQSection />
      </main>

      <Footer />
    </div>
  );
}
