'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

export function FAQSection() {
  const locale = useLocale();
  const isId = locale === 'id';

  const faqs: FAQItem[] = isId 
    ? [
        {
          q: "Apa itu Smart Matching MCDM Valam?",
          a: "Smart Matching MCDM adalah fitur cerdas yang menyaring dan merangking kualitas minyak nilam (seperti kadar Patchouli Alcohol %, kadar air, ketersediaan volume, dan kecocokan harga) menggunakan algoritma Multi-Criteria Decision Making (MCDM) untuk mempertemukan pembeli global dengan kelompok tani/koperasi terbaik secara objektif dan instan."
        },
        {
          q: "Bagaimana keaslian sertifikat analisis (CoA) dijamin?",
          a: "Setiap batch minyak nilam yang terdaftar di Valam wajib melewati pengujian laboratorium terakreditasi atsiri (GC-MS). Hasil uji laboratorium diunggah langsung dengan jaminan tanda tangan digital terenkripsi, koordinat pemetaan GPS asal terroir daun nilam, dan kode lacak batch yang transparan."
        },
        {
          q: "Bagaimana sistem rekening bersama (Escrow) Valam bekerja?",
          a: "Valam menyediakan sistem pembayaran aman (escrow) di mana dana transaksi buyer akan ditampung sementara di rekening penampung resmi. Dana ini hanya akan dicairkan ke rekening koperasi supplier setelah komoditas minyak nilam tiba di lokasi bongkar muat dan lulus verifikasi uji fisik ulang kadar PA% oleh tim Quality Control independen kami."
        }
      ]
    : [
        {
          q: "What is Valam's MCDM Smart Matching?",
          a: "MCDM Smart Matching is an intelligent feature that filters and ranks patchouli oil quality criteria (such as Patchouli Alcohol %, moisture level, batch volume, and price alignment) using Multi-Criteria Decision Making (MCDM) mathematical models to objectively connect global fragrance buyers with the most ideal cooperatives instantly."
        },
        {
          q: "How is the authenticity of the Certificate of Analysis (CoA) guaranteed?",
          a: "Every batch of patchouli oil registered on Valam must undergo gas chromatography-mass spectrometry (GC-MS) testing in an accredited essential oil laboratory. The analysis results are directly uploaded onto the platform with secure digital signatures, GPS tracking of the terroir farm origin, and a fully transparent traceability code."
        },
        {
          q: "How does Valam's secure Escrow payment system work?",
          a: "Valam provides an escrow system where the buyer's funds are held securely in a neutral account. Funds are released to the supplier's bank account only after the patchouli cargo arrives at the designated warehouse and successfully passes physically independent QC testing for PA% levels."
        }
      ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="pb-16 sm:pb-20 md:pb-24 pt-4 sm:pt-6 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-emerald-50/50" />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-3xl relative z-10">
        
        {/* Header Section */}
        <div className="text-left space-y-1 mb-5">
          <h2 className="font-serif font-bold text-zinc-900 text-xs md:text-sm uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
            {isId ? 'Pertanyaan Umum (F.A.Q)' : 'Frequently Asked Questions (F.A.Q)'}
          </h2>
        </div>

        {/* Collapsible FAQ list */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="bg-white rounded-xl border border-zinc-200 hover:border-emerald-500/30 transition-all shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 md:p-5 text-left focus:outline-none select-none"
                >
                  <h3 className="font-bold text-zinc-900 text-xs md:text-sm font-serif pr-4 leading-snug">
                    {faq.q}
                  </h3>
                  {isOpen ? (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-900 rotate-180 transition-all duration-300 shrink-0">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-zinc-100 text-zinc-500 transition-all duration-300 shrink-0">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-4 pb-4 md:px-5 md:pb-5 text-[11px] md:text-xs text-zinc-600 leading-relaxed font-light border-t border-zinc-100 pt-3 bg-zinc-50/50">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Chatbot trigger button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('valam_open_chat'))}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-950 text-white font-bold text-[10px] tracking-wider hover:bg-emerald-900 transition-colors shadow-md border border-emerald-800 cursor-pointer"
          >
            <span>{isId ? 'Tanyakan Asisten Digital Nila' : 'Ask Nila Assistant'}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          </button>
        </div>

      </div>
    </section>
  );
}
