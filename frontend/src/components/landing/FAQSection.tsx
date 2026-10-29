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

  const faqs: FAQItem[] = isId ? [{"q":"Bagaimana matching menentukan hasil?","a":"MCDM memakai jarak Euclidean berbobot ke titik ideal. Kecocokan penuh dipisahkan dari alternatif berdasarkan PA, air, harga, volume dan MOQ. Skor relatif bukan jaminan mutu."},{"q":"Bagaimana membaca hasil uji batch?","a":"Periksa nama laboratorium, nomor laporan, tanggal uji dan dokumen sumber jika tersedia. Akreditasi dan kelulusan tidak diasumsikan. Tanpa aturan evaluasi yang terdokumentasi, mutu batch belum dievaluasi."},{"q":"Bagaimana pembayaran dan saldo pemasok dicatat?","a":"Pembayaran harus dikonfirmasi gateway. Pengiriman dan penerimaan buyer terpisah; unggah bukti pengiriman tidak mencairkan dana. Saldo adalah ledger internal, permintaan penarikan bukan transfer bank. Refund baru selesai setelah konfirmasi gateway. Tidak ada janji escrow pihak ketiga."}] : [{"q":"How are matching results ranked?","a":"MCDM uses weighted Euclidean distance to an ideal point. Full matches and alternatives are separated by PA, moisture, price, volume and MOQ. Relative scores do not guarantee quality."},{"q":"How should I read batch test records?","a":"Check the laboratory, report number, test date and source document when available. Accreditation and approval are not assumed. Quality remains unevaluated without documented rules."},{"q":"How are payments and supplier balances recorded?","a":"Payment must be confirmed by the gateway. Shipping and buyer receipt are separate; shipping evidence does not release funds. The wallet is an internal ledger, and a withdrawal request is not a bank transfer. Refund completion requires gateway confirmation. Third-party escrow is not promised."}];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="pb-16 sm:pb-20 md:pb-24 pt-4 sm:pt-6 relative">
      <div className="absolute inset-0 bg-emerald-50/25 pointer-events-none" />

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
