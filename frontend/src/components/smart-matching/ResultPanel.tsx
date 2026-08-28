'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, Info, X, Lock } from 'lucide-react';
import { RadarAnimation } from './RadarAnimation';
import { MatchResultCard } from './MatchResultCard';
import { formatRupiah } from '@/lib/utils';
import { useAuthContext } from '@/components/providers/AuthProvider';

interface Product {
  id: string;
  batch_code: string;
  supplier_name: string;
  supplier_id: string;
  available_volume_kg: number;
  pa_percentage: number;
  moisture: number;
  price_per_kg: number;
  match_score: number;
}

interface ResultPanelProps {
  hasSearched: boolean;
  loading: boolean;
  results: Product[];
  locale: string;
  onRfqClick: (e: React.MouseEvent) => void;
  criteria: {
    volume_kg: number;
    min_pa: number;
    max_budget: number;
    max_moisture: number;
  };
  translations: {
    title: string;
    subtitle: string;
    readyTitle: string;
    readyDesc: string;
    emptyTitle: string;
    emptyDesc: string;
    matchScore: string;
    stock: string;
    pa: string;
    moisture: string;
    priceLabel: string;
    btnDetail: string;
    btnRfq: string;
    bestMatch: string;
  };
}

export function ResultPanel({
  hasSearched,
  loading,
  results,
  locale,
  onRfqClick,
  criteria,
  translations,
}: ResultPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const isEn = locale === 'en';
  
  // Auth context states
  const { isAuthenticated, role } = useAuthContext();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState<'guest' | 'non-buyer' | null>(null);

  // Comparison select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  const handleCompareToggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        // limit to 2
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const selectedProducts = results.filter((p) =>
    selectedIds.includes(p.id)
  );

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleOpenModal = () => {
    if (selectedProducts.length === 2) {
      setShowModal(true);
    }
  };

  const handleRfqClickInternal = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setAuthModalType('guest');
      setShowAuthModal(true);
    } else if (role !== 'buyer') {
      e.preventDefault();
      setAuthModalType('non-buyer');
      setShowAuthModal(true);
    }
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, x: 40 }}
      whileInView={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="lg:col-span-8 w-full lg:h-full h-auto flex flex-col overflow-hidden"
    >
      <AnimatePresence mode="wait">
        
        {/* State 1: Idle (Not searched yet) */}
        {!hasSearched && !loading && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="lg:flex-1 min-h-[400px] flex flex-col items-center justify-center text-center p-8 border border-zinc-200/80 rounded-3xl bg-white shadow-md relative overflow-hidden"
          >
            {/* SVG Radar sweep animation wrapper */}
            <RadarAnimation />
            
            <h3 className="text-lg font-bold text-emerald-950 mb-2 font-serif">
              {translations.readyTitle}
            </h3>
            <p className="text-zinc-500 text-xs max-w-sm leading-relaxed font-sans font-medium">
              {translations.readyDesc}
            </p>
          </motion.div>
        )}

        {/* State 2: Loading shimmers */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 lg:flex-1 lg:overflow-y-auto pr-1 no-scrollbar"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="relative overflow-hidden bg-white p-6 rounded-3xl border border-zinc-200 h-36 flex flex-col justify-center space-y-4"
              >
                {/* shimmer sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-100/50 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-200 shrink-0" />
                  <div className="space-y-2.5 flex-1">
                    <div className="h-4 bg-zinc-200 rounded w-1/3" />
                    <div className="h-3 bg-zinc-200 rounded w-1/2" />
                  </div>
                  <div className="w-24 h-8 bg-zinc-200 rounded shrink-0" />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* State 3: Empty results */}
        {hasSearched && !loading && results.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center p-12 bg-white rounded-3xl border border-zinc-200 lg:flex-1 flex flex-col items-center justify-center shadow-sm"
          >
            <Info className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-emerald-950 mb-2 font-serif">
              {translations.emptyTitle}
            </h3>
            <p className="text-zinc-500 text-xs max-w-md mx-auto leading-relaxed font-medium">
              {translations.emptyDesc}
            </p>
          </motion.div>
        )}

        {/* State 4: Match results display */}
        {hasSearched && !loading && results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden h-full"
          >
            <div className="flex items-center justify-between mb-1 px-1 shrink-0">
              <div>
                <h3 className="font-bold text-emerald-950 text-base font-serif">
                  {translations.title}
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                  {translations.subtitle}
                </p>
              </div>
            </div>

            <div className="space-y-4 lg:flex-1 lg:overflow-y-auto pr-1 no-scrollbar pb-16 lg:pb-0">
              {results.map((product, idx) => (
                <MatchResultCard
                  key={product.id || String(idx)}
                  product={product}
                  idx={idx}
                  locale={locale}
                  checked={selectedIds.includes(product.id)}
                  onCompareToggle={handleCompareToggle}
                  onRfqClick={handleRfqClickInternal}
                  criteria={criteria}
                  translations={translations}
                  isAuthenticated={isAuthenticated}
                  role={role}
                />
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Floating Compare Bar */}
      <AnimatePresence>
        {selectedProducts.length === 2 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl"
          >
            <div className="glass shadow-2xl rounded-2xl border border-emerald-500/20 px-6 py-4 flex items-center justify-between gap-4 bg-emerald-950/90 text-white">
              <div className="flex items-center gap-2 text-xs md:text-sm font-semibold truncate">
                <span className="text-emerald-400 truncate font-serif">{selectedProducts[0].supplier_name}</span>
                <span className="text-zinc-400 font-bold">vs</span>
                <span className="text-emerald-400 truncate font-serif">{selectedProducts[1].supplier_name}</span>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleOpenModal}
                  className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-300 hover:from-gold-400 hover:to-gold-200 text-forest-950 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 border-none"
                >
                  <span>📊</span> {isEn ? 'Compare' : 'Bandingkan'}
                </button>
                
                <button
                  onClick={() => setSelectedIds([])}
                  className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Modal Overlay */}
      <AnimatePresence>
        {showModal && selectedProducts.length === 2 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-zinc-200/80 max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-150 mb-6 shrink-0">
                <div>
                  <h3 className="font-serif text-lg font-bold text-emerald-950">
                    {isEn ? 'Comparison Analysis' : 'Analisis Perbandingan'}
                  </h3>
                  <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                    {isEn ? 'MCDM Criteria Match' : 'Kesesuaian Kriteria MCDM'}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Compare Table */}
              <div className="overflow-y-auto pr-1 flex-1 font-sans">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-150">
                      <th className="text-left font-serif font-bold text-zinc-400 pb-3 w-1/3">
                        {isEn ? 'Specs / Feature' : 'Kriteria / Spesifikasi'}
                      </th>
                      <th className="text-center font-serif font-bold text-emerald-950 pb-3 w-1/3">
                        {selectedProducts[0].supplier_name}
                      </th>
                      <th className="text-center font-serif font-bold text-emerald-950 pb-3 w-1/3">
                        {selectedProducts[1].supplier_name}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Match Score */}
                    <tr className="border-b border-zinc-100 hover:bg-zinc-50/50">
                      <td className="py-4 font-bold text-zinc-700">Match Score</td>
                      <td className="py-4 text-center font-extrabold text-emerald-600 text-base">
                        {selectedProducts[0].match_score}%
                      </td>
                      <td className="py-4 text-center font-extrabold text-emerald-600 text-base">
                        {selectedProducts[1].match_score}%
                      </td>
                    </tr>
                    
                    {/* Price per Kg */}
                    <tr className="border-b border-zinc-100 hover:bg-zinc-50/50">
                      <td className="py-4 font-bold text-zinc-700">
                        {isEn ? 'Price / Kg' : 'Harga / Kg'}
                      </td>
                      <td className="py-4 text-center font-extrabold text-zinc-900">
                        {formatRupiah(selectedProducts[0].price_per_kg)}
                      </td>
                      <td className="py-4 text-center font-extrabold text-zinc-900">
                        {formatRupiah(selectedProducts[1].price_per_kg)}
                      </td>
                    </tr>

                    {/* PA% Level */}
                    <tr className="border-b border-zinc-100 hover:bg-zinc-50/50">
                      <td className="py-4 font-bold text-zinc-700">Kadar PA%</td>
                      <td className="py-4 text-center font-bold text-zinc-800">
                        {selectedProducts[0].pa_percentage}%
                      </td>
                      <td className="py-4 text-center font-bold text-zinc-800">
                        {selectedProducts[1].pa_percentage}%
                      </td>
                    </tr>

                    {/* Moisture Level */}
                    <tr className="border-b border-zinc-100 hover:bg-zinc-50/50">
                      <td className="py-4 font-bold text-zinc-700">Kadar Air%</td>
                      <td className="py-4 text-center font-bold text-zinc-800">
                        {selectedProducts[0].moisture}%
                      </td>
                      <td className="py-4 text-center font-bold text-zinc-800">
                        {selectedProducts[1].moisture}%
                      </td>
                    </tr>

                    {/* Available volume */}
                    <tr className="border-b border-zinc-100 hover:bg-zinc-50/50">
                      <td className="py-4 font-bold text-zinc-700">Stok Kargo</td>
                      <td className="py-4 text-center font-bold text-zinc-800">
                        {selectedProducts[0].available_volume_kg} kg
                      </td>
                      <td className="py-4 text-center font-bold text-zinc-800">
                        {selectedProducts[1].available_volume_kg} kg
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Close Button footer */}
              <div className="pt-4 border-t border-zinc-150 mt-6 shrink-0 text-right">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors border-none"
                >
                  {isEn ? 'Close' : 'Tutup'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guest Mode Auth Restriction Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-zinc-200/80 max-w-sm w-full p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              
              <div>
                <h3 className="font-serif text-lg font-bold text-emerald-950">
                  {authModalType === 'guest'
                    ? (isEn ? 'Login Required' : 'Login Diperlukan')
                    : (isEn ? 'Restricted Access' : 'Akses Terbatas')}
                </h3>
                <p className="text-xs text-zinc-550 font-medium leading-relaxed mt-2">
                  {authModalType === 'guest'
                    ? (isEn 
                        ? 'Login as a Buyer to submit a Request for Quotation (RFQ) to this supplier.' 
                        : 'Login sebagai Buyer untuk mengajukan permintaan ke supplier ini.')
                    : (isEn 
                        ? 'This feature is only available for Buyer accounts.' 
                        : 'Fitur ini khusus untuk akun Buyer.')}
                </p>
              </div>

              <div className="w-full pt-4 flex flex-col gap-2.5">
                {authModalType === 'guest' ? (
                  <>
                    <a
                      href={`/${locale}/login?redirect=/matching`}
                      className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors text-center shadow-md"
                    >
                      {isEn ? 'Login as Buyer' : 'Login sebagai Buyer'}
                    </a>
                    <a
                      href={`/${locale}/register`}
                      className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors text-center border border-zinc-200"
                    >
                      {isEn ? 'Register New Account' : 'Daftar Akun Baru'}
                    </a>
                  </>
                ) : null}
                
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-full py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors text-center border-none"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

export default ResultPanel;
