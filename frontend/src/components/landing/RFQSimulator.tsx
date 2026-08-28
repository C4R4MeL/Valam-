"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";

export function RFQSimulator() {
  const locale = useLocale();
  const isId = locale === "id";

  const [status, setStatus] = useState<"counter_offer" | "deal" | "rejected_input">("counter_offer");
  const [supplierPrice, setSupplierPrice] = useState(500000);
  const [customCounter, setCustomCounter] = useState("475000");
  const [isShaking, setIsShaking] = useState(false);

  const content = {
    sectionLabel: isId ? "BAGAIMANA NEGOSIASI BERJALAN?" : "HOW NEGOTIATION WORKS?",
    badge: isId ? "Logistik & Simulasi Transaksi" : "Logistics & Trade Simulation",
    title: isId ? "Simulasi RFQ Ekspor" : "Instant Export RFQ",
    titleHighlight: isId ? "Instan" : "Simulation",
    desc: isId
      ? "Platform kami menyediakan dashboard bagi pembeli dan penjual untuk memantau status pesanan (RFQ), negosiasi, dan verifikasi sertifikat CoA secara waktu nyata."
      : "Our platform provides a dashboard for buyers and suppliers to monitor order status (RFQ), negotiation, and CoA verification in real-time.",
    docs: [
      isId ? "Certificate of Analysis (Lab Terakreditasi)" : "Certificate of Analysis (Accredited Lab)",
      isId ? "GPS Terroir Leaf Signature" : "GPS Terroir Leaf Signature",
      isId ? "Escrow Smart Contract Bill" : "Escrow Smart Contract Bill",
    ],
    rfqButton: isId ? "Ajukan RFQ Resmi" : "Submit Official RFQ",
    cardStatusLabel: isId ? "Status Negosiasi RFQ" : "RFQ Negotiation Status",
    cardVolLabel: isId ? "Volume Permintaan" : "Requested Volume",
    cardBudgetLabel: isId ? "Budget Awal" : "Initial Budget",
    cardSupplierLabel: isId ? "Penawaran Supplier" : "Supplier's Offer",
    dealText: isId
      ? "Transaksi disepakati! Dana masuk escrow."
      : "Deal agreed! Funds moved to escrow.",
    counterPlaceholder: isId ? "Masukkan harga tawar baru" : "Enter new counter price",
    btnSubmitCounter: isId ? "Ajukan Harga" : "Submit Counter",
    btnReset: isId ? "Reset Simulasi" : "Reset Simulation",
  };

  const handleAccept = () => {
    setStatus("deal");
  };

  const handleReject = () => {
    setStatus("rejected_input");
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleSubmitCounter = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseInt(customCounter.replace(/[^0-9]/g, ""));
    if (priceNum > 0) {
      setSupplierPrice(priceNum);
      setStatus("counter_offer");
    }
  };

  const handleReset = () => {
    setStatus("counter_offer");
    setSupplierPrice(500000);
    setCustomCounter("475000");
  };

  const formatCurrency = (val: number) => {
    return isId
      ? `Rp ${val.toLocaleString("id-ID")} / kg`
      : `IDR ${val.toLocaleString("en-US")} / kg`;
  };

  return (
    <section className="py-20 md:py-28 bg-zinc-950 text-white relative overflow-hidden">
      {/* Visual Bridge - Gradient from white/light-gray to black */}
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-zinc-50 to-zinc-950 pointer-events-none z-0" />
      <div className="absolute top-20 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent z-0" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Left Column: Info & Explanations */}
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase block">
                {content.sectionLabel}
              </span>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                {content.title} <span className="text-emerald-400">{content.titleHighlight}</span>
              </h2>
            </div>
            
            <p className="text-zinc-400 text-base md:text-lg leading-relaxed">
              {content.desc}
            </p>

            <ul className="space-y-4">
              {content.docs.map((doc, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-300">
                  <div className="w-6 h-6 rounded-full bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-zinc-200 font-medium text-sm md:text-base">
                    {doc}
                  </span>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 rounded-full px-8 py-3 font-semibold transition-all duration-300">
                <Link href={`/${locale}/register`}>{content.rfqButton}</Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Interactive Card */}
          <div className="relative perspective-1000">
            <motion.div
              animate={isShaking ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`bg-zinc-900 border rounded-3xl p-6 md:p-8 shadow-2xl transition-all duration-500 ${
                status === "deal"
                  ? "border-emerald-500/80 shadow-emerald-900/25 ring-2 ring-emerald-500/20"
                  : "border-zinc-800 shadow-emerald-950/15"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-800">
                <div>
                  <span className="text-zinc-500 text-xs md:text-sm uppercase tracking-wider block mb-1">
                    {content.cardStatusLabel}
                  </span>
                  <div className="text-xl md:text-2xl font-bold text-white tracking-wide">
                    RFQ-1704259123
                  </div>
                </div>
                
                <AnimatePresence mode="wait">
                  {status === "deal" ? (
                    <motion.span
                      key="deal-badge"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 tracking-wider"
                    >
                      DEAL ✓
                    </motion.span>
                  ) : status === "rejected_input" ? (
                    <motion.span
                      key="reject-badge"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="px-3.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 tracking-wider"
                    >
                      RE-NEGOTIATING
                    </motion.span>
                  ) : (
                    <motion.span
                      key="counter-badge"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30 tracking-wider"
                    >
                      COUNTER OFFER
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Card Body */}
              <div className="space-y-6">
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-zinc-400">{content.cardVolLabel}</span>
                  <span className="font-semibold text-white font-mono">500 kg</span>
                </div>
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-zinc-400">{content.cardBudgetLabel}</span>
                  <span className="font-semibold text-white font-mono">
                    {formatCurrency(450000)}
                  </span>
                </div>

                <div className="relative overflow-hidden min-h-[80px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {status === "deal" ? (
                      <motion.div
                        key="deal-section"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full bg-emerald-950/40 text-emerald-300 p-4 rounded-2xl border border-emerald-800/40 text-center font-medium flex flex-col items-center gap-1.5"
                      >
                        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-emerald-950 font-bold">
                          ✓
                        </div>
                        {content.dealText}
                      </motion.div>
                    ) : status === "rejected_input" ? (
                      <motion.form
                        key="counter-input"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onSubmit={handleSubmitCounter}
                        className="w-full space-y-3"
                      >
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">
                              {isId ? "Rp" : "IDR"}
                            </span>
                            <input
                              type="text"
                              value={customCounter}
                              onChange={(e) =>
                                setCustomCounter(e.target.value.replace(/[^0-9]/g, ""))
                              }
                              placeholder={content.counterPlaceholder}
                              className="w-full bg-zinc-800 text-white pl-10 pr-4 py-2.5 rounded-xl border border-zinc-700 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>
                          <button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 rounded-xl transition-colors shrink-0"
                          >
                            {content.btnSubmitCounter}
                          </button>
                        </div>
                      </motion.form>
                    ) : (
                      <motion.div
                        key="counter-offer-section"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full bg-zinc-800/60 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center text-sm md:text-base"
                      >
                        <span className="text-zinc-300">{content.cardSupplierLabel}</span>
                        <span className="font-mono font-bold text-emerald-400 text-lg">
                          {formatCurrency(supplierPrice)}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bottom Control Buttons */}
                <div className="pt-4 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      onClick={handleAccept}
                      disabled={status === "deal"}
                      className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {isId ? "Terima" : "Accept"}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={status === "deal"}
                      className="flex-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 py-2.5 rounded-xl text-sm font-semibold transition-colors border border-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {isId ? "Tawar" : "Counter"}
                    </button>
                  </div>
                  
                  {/* Reset Button */}
                  {(status !== "counter_offer" || supplierPrice !== 500000) && (
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center justify-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs font-medium py-1 transition-colors self-center group"
                    >
                      <RotateCcw className="w-3 h-3 group-hover:rotate-[-45deg] transition-transform duration-300" />
                      {content.btnReset}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
