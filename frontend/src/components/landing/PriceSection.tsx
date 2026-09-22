"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getLatestMarketPrices } from "@/lib/valam-insights/insights-api";
import { GRADE_SPECS, mergeMarketPrices } from "@/lib/market-grades";
import { formatPrice } from "@/lib/valam-insights/utils";

export function PriceSection() {
  const locale = useLocale();
  const [priceData, setPriceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    async function loadPrices() {
      try {
        const prices = await getLatestMarketPrices();
        const mergedPrices = mergeMarketPrices(prices);
        
        // Format prices dengan spesifikasi grade yang konsisten
        const formattedPrices = mergedPrices.map((item: any) => {
          const specs = GRADE_SPECS[item.grade];
          return {
            grade: `Grade ${item.grade}${item.grade === "A" ? " ⭐" : ""}`,
            pa: isId ? specs.pa : specs.pa.replace(/%/, "%"),
            price: formatPrice(Number(item.price_per_kg), item.currency),
            market: isId ? specs.marketId : specs.marketEn,
            highlight: specs.highlight,
          };
        });

        setPriceData(formattedPrices);
      } catch (error) {
        console.error("Failed to load market prices:", error);
        // Fallback: use GRADE_SPECS dengan fallback prices
        const fallbackPrices = [
          { grade: "A", price: 850000 },
          { grade: "B", price: 780000 },
          { grade: "C", price: 680000 },
        ].map((item) => {
          const specs = GRADE_SPECS[item.grade as 'A' | 'B' | 'C'];
          return {
            grade: `Grade ${item.grade}${item.grade === "A" ? " ⭐" : ""}`,
            pa: isId ? specs.pa : specs.pa.replace(/%/, "%"),
            price: formatPrice(item.price, "IDR"),
            market: isId ? specs.marketId : specs.marketEn,
            highlight: specs.highlight,
          };
        });
        setPriceData(fallbackPrices);
      } finally {
        setLoading(false);
      }
    }

    loadPrices();
  }, [isId]);

  return (
    <section className="py-14 sm:py-20 md:py-24 border-t border-zinc-200/60 relative">
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
            {loading ? (
              <div className="w-full min-w-[540px] p-12 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin mx-auto" />
                  <p className="text-zinc-500 text-sm">{isId ? "Memuat harga..." : "Loading prices..."}</p>
                </div>
              </div>
            ) : (
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
            )}
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
