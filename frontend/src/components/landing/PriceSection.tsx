"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";

export function PriceSection() {
  const locale = useLocale();

  const isId = locale === "id";

  const today = new Date().toLocaleDateString(isId ? "id-ID" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const content = {
    label: isId ? "HARGA PASAR" : "MARKET PRICE",
    title: isId ? "Harga Minyak Nilam Aceh Hari Ini" : "Aceh Patchouli Oil Price Today",
    subtitle: isId
      ? `Diperbarui oleh tim Valam · ${today}`
      : `Updated by Valam team · ${today}`,
    thGrade: isId ? "Grade" : "Grade",
    thPa: isId ? "Kadar PA" : "PA Content",
    thPrice: isId ? "Harga / Kg" : "Price / Kg",
    thMarket: isId ? "Pasar Utama" : "Primary Market",
    mostPopular: isId ? "Paling Diminati" : "Most Popular",
    disclaimer: isId
      ? "Harga bersifat estimasi berdasarkan data pasar terkini. Harga aktual ditentukan melalui negosiasi RFQ."
      : "Prices are estimates based on current market data. Actual prices are determined through RFQ negotiation.",
    cta: isId ? "Lihat histori harga" : "View price history",
  };

  const priceData = [
    {
      grade: "Grade A ⭐",
      pa: ">30%",
      price: isId ? "Rp 450.000" : "IDR 450,000",
      market: isId ? "Eropa, Jepang" : "Europe, Japan",
      highlight: true,
    },
    {
      grade: "Grade B",
      pa: "25–30%",
      price: isId ? "Rp 380.000" : "IDR 380,000",
      market: isId ? "Timur Tengah" : "Middle East",
      highlight: false,
    },
    {
      grade: "Grade C",
      pa: "<25%",
      price: isId ? "Rp 300.000" : "IDR 300,000",
      market: isId ? "Domestik" : "Domestic",
      highlight: false,
    },
  ];

  return (
    <section className="py-14 sm:py-20 md:py-24 bg-white border-t border-zinc-100 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3 sm:space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-sans text-zinc-900 leading-tight inline-flex items-center justify-center gap-2 sm:gap-3 flex-wrap w-full">
            <span>{content.title}</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live
            </span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-zinc-500 font-normal">
            {content.subtitle}
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-zinc-200/40 border border-zinc-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[540px]">
              <thead>
                <tr className="bg-emerald-950 text-white text-xs md:text-sm font-semibold uppercase tracking-wider">
                  <th className="px-4 sm:px-6 py-3.5 md:py-5">{content.thGrade}</th>
                  <th className="px-4 sm:px-6 py-3.5 md:py-5">{content.thPa}</th>
                  <th className="px-4 sm:px-6 py-3.5 md:py-5">{content.thPrice}</th>
                  <th className="px-4 sm:px-6 py-3.5 md:py-5">{content.thMarket}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm md:text-base">
                {priceData.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors duration-200 hover:bg-zinc-50/50 ${row.highlight
                        ? "bg-emerald-50/60 font-medium"
                        : ""
                      }`}
                  >
                    <td className="px-6 py-5 md:py-6 flex items-center gap-3">
                      <span className="font-semibold text-zinc-900">{row.grade}</span>
                      {row.highlight && (
                        <span className="px-2 py-0.5 text-[10px] md:text-xs rounded-full bg-emerald-600 text-white font-semibold">
                          {content.mostPopular}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 md:py-6 text-zinc-600 font-mono">
                      {row.pa}
                    </td>
                    <td className="px-6 py-5 md:py-6 text-emerald-700 font-bold font-mono text-lg">
                      {row.price}
                    </td>
                    <td className="px-6 py-5 md:py-6 text-zinc-600">
                      {row.market}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-zinc-50/80 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs md:text-sm">
            <p className="text-zinc-500 italic max-w-2xl text-center md:text-left leading-relaxed">
              {content.disclaimer}
            </p>
            <Link
              href={`/${locale}/insights`}
              className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-semibold hover:underline transition-colors shrink-0 group"
            >
              {content.cta}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
