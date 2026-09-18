"use client";

import { Link, useRouter } from "@/i18n/routing";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
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


const fadeInUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export default function Home() {
  const locale = useLocale();
  const isId = locale === "id";
  const content = landingContent[locale as keyof typeof landingContent] || landingContent.en;
  
  const router = useRouter();
  const { isAuthenticated, role, isLoading } = useAuthContext();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (role === 'supplier' || role === 'admin') {
        router.push('/dashboard/supplier');
      } else {
        router.push('/marketplace');
      }
    }
  }, [isLoading, isAuthenticated, role, router]);
  
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

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col font-sans valam-grid-bg">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans valam-grid-bg selection:bg-emerald-100 selection:text-emerald-900 overflow-x-clip">
      <Navbar />

      <main className="flex-1">
        {/* ═══════════════════ HERO SECTION ═══════════════════ */}
        <section className="relative w-full pb-8 sm:pb-12">
          <div className="relative w-full min-h-[90vh] flex flex-col justify-center pt-28 sm:pt-32 pb-16 rounded-b-[2.5rem] sm:rounded-b-[3rem] overflow-hidden shadow-2xl">
            {/* Background Image Carousel */}
            {content.heroSlides.map((slide, index) => (
              <div 
                key={index}
                className={`absolute inset-0 z-0 transition-all duration-1000 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${currentSlide === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover blur-[2px]"
                  priority={index === 0}
                />
                {/* Overlay for optimal text readability */}
                <div className="absolute inset-0 bg-emerald-950/60 mix-blend-multiply transition-opacity duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
              </div>
            ))}

          <div className="container relative z-10 px-4 sm:px-6 md:px-8 mx-auto">
            <div className="flex flex-col items-center space-y-5 sm:space-y-6 text-center max-w-4xl mx-auto justify-center">
              
              {/* Dynamic Content wrapper */}
              <div key={currentSlide} className="flex flex-col items-center space-y-4 sm:space-y-5 animate-fade-up">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/25 text-emerald-100 text-[11px] sm:text-xs font-semibold tracking-[0.08em] uppercase backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {content.heroSlides[currentSlide].badge}
                </div>

                {/* Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-serif font-semibold text-white tracking-[-0.02em] leading-[1.15] text-balance max-w-4xl">
                  {content.heroSlides[currentSlide].title}{" "}
                  <span className="font-serif italic font-medium text-amber-300 inline-block mt-1 sm:mt-2">
                    {content.heroSlides[currentSlide].highlight}
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="mx-auto max-w-[640px] text-sm sm:text-[15px] md:text-base text-zinc-100/85 leading-relaxed font-sans font-normal px-2">
                  {content.heroSlides[currentSlide].subtitle}
                </p>
              </div>

              {/* Carousel Indicators */}
              <div className="flex gap-2 mt-1">
                {content.heroSlides.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-7 bg-amber-400' : 'w-2.5 bg-white/35 hover:bg-white/60'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-3.5 pt-2 w-full sm:w-auto px-4 sm:px-0 animate-fade-up" style={{ animationDelay: "0.3s" }}>
                <Link href="/marketplace" prefetch={true} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-12 px-7 text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 rounded-xl transition-all duration-300 hover:translate-y-[-1px] font-semibold border-0"
                  >
                    {content.buttons.searchOil}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/register" prefetch={true} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto h-12 px-7 text-sm bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/50 text-white backdrop-blur-md rounded-xl transition-all duration-300 hover:translate-y-[-1px] font-medium"
                  >
                    {content.buttons.startSupplier}
                  </Button>
                </Link>
              </div>

            </div>

            {/* Floating Stats Bar */}
            <motion.div
              onViewportEnter={() => { suppliersCounter.start(); destinationsCounter.start(); verifiedCounter.start(); }}
              className="mt-8 sm:mt-10 w-full max-w-3xl mx-auto rounded-2xl p-4 sm:p-5 shadow-2xl shadow-emerald-950/40 animate-fade-up bg-emerald-950/55 backdrop-blur-xl border border-emerald-700/25"
              style={{ animationDelay: "0.5s" }}
            >
              <div className="grid grid-cols-3 divide-x divide-emerald-700/35">
                <div className="flex flex-col items-center px-2 sm:px-4">
                  <span className="text-2xl sm:text-3xl md:text-[2.25rem] font-bold text-white tracking-tight tabular-nums">
                    {suppliersCounter.count}+
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-emerald-200/75 mt-1 uppercase tracking-[0.1em] text-center font-medium">
                    {content.stats.suppliers}
                  </span>
                </div>
                <div className="flex flex-col items-center px-2 sm:px-4">
                  <span className="text-2xl sm:text-3xl md:text-[2.25rem] font-bold text-white tracking-tight tabular-nums">
                    {destinationsCounter.count}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-emerald-200/75 mt-1 uppercase tracking-[0.1em] text-center font-medium">
                    {content.stats.destinations}
                  </span>
                </div>
                <div className="flex flex-col items-center px-2 sm:px-4">
                  <span className="text-2xl sm:text-3xl md:text-[2.25rem] font-bold text-white tracking-tight tabular-nums">
                    {verifiedCounter.count.toLocaleString()}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-emerald-200/75 mt-1 uppercase tracking-[0.1em] text-center font-medium">
                    {content.stats.verified}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
          </div>
        </section>

        {/* VISION SECTION */}
        <section className="py-14 sm:py-20 md:py-24 relative">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
                className="lg:col-span-5 space-y-5 sm:space-y-6"
              >
                <div className="space-y-3">
                  <motion.div variants={fadeInUp} className="text-emerald-700 font-semibold tracking-[0.12em] text-[11px] uppercase">{content.vision.badge}</motion.div>
                  <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl md:text-[2.35rem] font-semibold font-serif text-zinc-900 tracking-tight leading-[1.2] text-balance">
                    {content.vision.title1} <span className="text-emerald-700">{content.vision.titleHighlight}</span> {content.vision.title2}
                  </motion.h2>
                </div>
                <motion.p variants={fadeInUp} className="text-sm sm:text-[15px] text-zinc-600 leading-relaxed font-normal">
                  {isId 
                    ? "Indonesia menyuplai 90% kebutuhan minyak nilam dunia. Komoditas ini merupakan bahan pengikat aroma parfum mewah. Valam hadir untuk menghubungkan petani langsung ke pasar ekspor dengan standar mutu terjamin."
                    : "Indonesia supplies 90% of global patchouli oil. This essential oil is the primary fixative for luxury perfumery. Valam connects local cooperatives directly with global buyers under fair pricing."}
                </motion.p>

                <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-3 sm:gap-5 pt-5 border-t border-zinc-200/70">
                  <div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-700 tabular-nums tracking-tight">90%</div>
                    <div className="text-[11px] sm:text-xs text-zinc-500 mt-1 leading-snug">
                      {isId ? "Pasokan Dunia dari Indonesia" : "World Supply from Indonesia"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-700 tabular-nums tracking-tight">28</div>
                    <div className="text-[11px] sm:text-xs text-zinc-500 mt-1 leading-snug">
                      {isId ? "Negara Tujuan Ekspor" : "Export Destinations"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-700 tracking-tight">{isId ? "Rp 450k" : "IDR 450k"}</div>
                    <div className="text-[11px] sm:text-xs text-zinc-500 mt-1 leading-snug">
                      {isId ? "Harga Grade A / Kg" : "Grade A Price / Kg"}
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="pt-1">
                  <Link href={`/${locale}/marketplace`} className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:text-emerald-800 transition-colors group text-sm">
                    {content.vision.cta}
                    <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }}
                className="lg:col-span-7 relative"
              >
                <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-zinc-200/60 relative">
                  <Image 
                    src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=600&fit=crop" 
                    alt="Patchouli Harvest" 
                    fill 
                    className="object-cover" 
                  />
                </div>
                <div className="absolute bottom-4 right-4 md:bottom-5 md:right-5 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-md border border-zinc-200/80 max-w-[240px] hidden md:block z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0 border border-emerald-100">
                      <IconTrending className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{isId ? "Sistem Cerdas" : "Smart Matching"}</div>
                      <div className="font-semibold text-sm text-zinc-900 tracking-tight">{isId ? "Pencocokan Presisi" : "Precision Matching"}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    {isId 
                      ? "Rekomendasi supplier berdasarkan kecocokan volume, budget, dan kadar PA terbaik."
                      : "Recommendations based on optimal volume, budget, and PA matching."}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-14 sm:py-20 md:py-24 border-t border-zinc-200/60 relative">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14 space-y-3 px-2">
              <motion.div variants={fadeInUp} className="inline-block px-3 py-1 rounded-full bg-white/80 border border-emerald-200/80 text-emerald-800 text-[11px] font-semibold tracking-[0.1em] uppercase">
                {content.features.badge}
              </motion.div>
              <h2 className="text-2xl sm:text-3xl md:text-[2.5rem] font-semibold font-serif text-zinc-900 tracking-tight leading-[1.2] text-balance">
                {content.features.title} <span className="text-emerald-700">{content.features.titleHighlight}</span>
              </h2>
              <p className="text-sm sm:text-[15px] text-zinc-600 leading-relaxed max-w-2xl mx-auto font-normal">
                {content.features.desc}
              </p>
            </div>

            <div className="space-y-5 md:space-y-6">
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6"
              >
                <motion.div variants={fadeInUp} className="bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-zinc-200/80 hover:border-emerald-600/25 group transition-all duration-300">
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden">
                    <Image src="/images/b2b_dashboard.png" alt="MCDM Smart Matching" fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/95 via-zinc-900/40 to-transparent" />
                    <div className="absolute bottom-5 left-5 flex items-center gap-3 text-white">
                       <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md border border-emerald-400/50">
                         <IconTrending className="w-4.5 h-4.5 text-white" />
                       </div>
                       <h3 className="text-lg sm:text-xl font-semibold tracking-tight">MCDM Smart Matching</h3>
                    </div>
                  </div>
                  <div className="p-5 sm:p-6">
                    <p className="text-zinc-600 leading-relaxed text-sm">
                      {isId 
                        ? "Sistem cerdas yang secara otomatis mencocokkan profil Volume, Budget, dan kadar PA% Anda dengan supplier paling ideal."
                        : "An intelligent system that automatically matches your volume, budget, and PA% requirements with the most ideal suppliers."}
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-zinc-200/80 hover:border-emerald-600/25 group transition-all duration-300">
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden">
                    <Image src="/images/lab_test.png" alt="Lab-Verified CoA" fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/95 via-zinc-900/40 to-transparent" />
                    <div className="absolute bottom-5 left-5 flex items-center gap-3 text-white">
                       <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md border border-emerald-400/50">
                         <IconShield className="w-4.5 h-4.5 text-white" />
                       </div>
                       <h3 className="text-lg sm:text-xl font-semibold tracking-tight">Lab-Verified CoA</h3>
                    </div>
                  </div>
                  <div className="p-5 sm:p-6">
                    <p className="text-zinc-600 leading-relaxed text-sm">
                      {isId 
                        ? "Setiap batch minyak nilam diuji di laboratorium terakreditasi. Anda menerima hasil nyata, bukan sekadar janji."
                        : "Every batch of patchouli oil is tested in an accredited laboratory. You receive real results, not just promises."}
                    </p>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6"
              >
                <motion.div variants={fadeInUp} className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-zinc-200/80 hover:border-emerald-600/25 shadow-sm hover:shadow-md group transition-all duration-300 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                      <IconMap className="w-5 h-5" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-zinc-900 tracking-tight">{isId ? "Keterlacakan 100%" : "100% Traceability"}</h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">
                      {isId
                        ? "Lacak perjalanan minyak nilam secara transparan dari kebun petani hingga pelabuhan."
                        : "Track your patchouli oil transparently from farmers' fields to the export port."}
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-zinc-200/80 hover:border-emerald-600/25 shadow-sm hover:shadow-md group transition-all duration-300 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                      <IconGlobe className="w-5 h-5" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-zinc-900 tracking-tight">{isId ? "Negosiasi Live RFQ" : "Live RFQ Negotiation"}</h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">
                      {isId
                        ? "Kirim permintaan penawaran harga, tawar-menawar, dan kunci kontrak langsung di platform."
                        : "Submit requests for quotation, negotiate prices, and lock contracts directly on the platform."}
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-zinc-200/80 hover:border-emerald-600/25 shadow-sm hover:shadow-md group transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-emerald-700 text-white font-semibold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {isId ? "Baru" : "New"}
                  </div>
                  <div className="space-y-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                      <IconShield className="w-5 h-5" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-zinc-900 tracking-tight">{isId ? "Escrow & Pembayaran Aman" : "Secure Escrow Payment"}</h3>
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
        <section className="py-16 sm:py-20 md:py-24 relative">
          <div className="container relative mx-auto px-4 sm:px-6 md:px-8 max-w-3xl text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-[2.75rem] font-semibold font-serif text-zinc-900 mb-4 sm:mb-5 tracking-tight leading-[1.2] text-balance"
            >
              {content.cta.title1} <span className="text-emerald-700">{content.cta.titleHighlight}</span> {content.cta.title2}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="text-sm sm:text-[15px] text-zinc-600 mb-8 sm:mb-9 font-normal leading-relaxed max-w-xl mx-auto"
            >
              {content.cta.desc}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-3.5 px-4 sm:px-0"
            >
              <Button asChild size="lg" className="w-full sm:w-auto h-12 px-8 text-sm bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-950/15 border-0 font-semibold">
                <Link href="/register" prefetch={true}>{content.cta.supplierButton}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-sm rounded-xl bg-white/90 border-zinc-200 text-zinc-700 hover:bg-white font-medium">
                <Link href="/register" prefetch={true}>{content.cta.buyerButton}</Link>
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
