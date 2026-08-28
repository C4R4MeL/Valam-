"use client";

import { useLocale } from "next-intl";
import { Quote } from "lucide-react";

export function TestimonialsSection() {
  const locale = useLocale();
  const isId = locale === "id";

  const content = {
    label: isId ? "TESTIMONI" : "TESTIMONIALS",
    title: isId ? "Kepercayaan yang Dibangun Bersama" : "Trust Built Together",
    subtitle: isId
      ? "Pengalaman dari mereka yang telah merasakan dampak positif ekosistem Valam."
      : "Experiences from those who have felt the positive impact of the Valam ecosystem.",
    buyerName: "Pierre Dupont",
    buyerRole: isId
      ? "Procurement Director, Grasse Fragrance Co., Perancis"
      : "Procurement Director, Grasse Fragrance Co., France",
    buyerReview: isId
      ? "\"Valam memecahkan masalah transparansi rantai pasok yang selama ini menjadi kendala industri parfum di Eropa. Kemampuan melacak terroir lahan perkebunan di Aceh hingga hasil uji GC-MS secara real-time sungguh luar biasa dan menjamin kemurnian bahan baku kami.\""
      : "\"Valam solved the supply chain transparency issues that have long plagued the European perfume industry. The ability to track farm terroir in Aceh and GC-MS test results in real-time is outstanding and guarantees our raw material purity.\"",
    supplierName: "Budi Santoso",
    supplierRole: isId
      ? "Ketua Koperasi Nilam Jaya, Aceh Barat"
      : "Head of Nilam Jaya Cooperative, West Aceh",
    supplierReview: isId
      ? "\"Dulu kami selalu berhadapan dengan tengkulak tanpa tahu harga pasaran minyak nilam yang adil. Sejak bergabung dengan Valam, setiap batch minyak kami dihargai pantas sesuai kadar PA% yang diuji langsung di laboratorium terakreditasi, langsung terhubung dengan buyer dunia secara transparan.\""
      : "\"We used to deal with middlemen without knowing the fair market price of patchouli oil. Since joining Valam, every oil batch is priced fairly according to the PA% verified by accredited lab testing, directly connecting us to global buyers.\"",
  };

  return (
    <section className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-20 bg-white border-t border-zinc-100 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 max-w-5xl mx-auto mb-16 border-b border-zinc-100 pb-8">
          <div className="flex items-center gap-4">
            <span className="text-3xl md:text-4xl font-extrabold text-amber-500 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200 shadow-sm shrink-0">
              4.9★
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-sans text-zinc-900 leading-tight">
              {content.title}
            </h2>
          </div>
          <p className="text-base text-zinc-500 max-w-sm font-light leading-relaxed">
            {content.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Buyer Testimonial */}
          <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100 hover:border-emerald-600/20 hover:shadow-lg transition-all duration-300 relative flex flex-col justify-between">
            <Quote className="absolute top-6 right-6 w-10 h-10 text-emerald-700/10 shrink-0" />
            <div className="space-y-4">
              <p className="text-zinc-600 italic text-base leading-relaxed">
                {content.buyerReview}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-zinc-200/60">
              <div className="w-12 h-12 rounded-full bg-zinc-200 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                  alt={content.buyerName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-sm md:text-base">
                  {content.buyerName}
                </h3>
                <p className="text-xs text-zinc-500">{content.buyerRole}</p>
              </div>
            </div>
          </div>

          {/* Supplier Testimonial */}
          <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100 hover:border-emerald-600/20 hover:shadow-lg transition-all duration-300 relative flex flex-col justify-between">
            <Quote className="absolute top-6 right-6 w-10 h-10 text-emerald-700/10 shrink-0" />
            <div className="space-y-4">
              <p className="text-zinc-600 italic text-base leading-relaxed">
                {content.supplierReview}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-zinc-200/60">
              <div className="w-12 h-12 rounded-full bg-zinc-200 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
                  alt={content.supplierName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-sm md:text-base">
                  {content.supplierName}
                </h3>
                <p className="text-xs text-zinc-500">{content.supplierRole}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
