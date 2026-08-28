"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface SupplierProfile {
  id: string;
  nama_koperasi: string;
  kabupaten: string;
  grade_nilam: string[];
  status: string;
  user?: {
    profile?: {
      avatar_url?: string;
    };
  };
}

export function SupplierProofSection() {
  const locale = useLocale();
  const isId = locale === "id";

  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      try {
        const res = await fetch(`${apiUrl}/suppliers?limit=4`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setSuppliers(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch verified suppliers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  const content = {
    label: isId ? "DIPERCAYA OLEH" : "TRUSTED BY",
    title: isId ? "Koperasi Terverifikasi yang Sudah Bergabung" : "Verified Cooperatives Already Joined",
    badgeVerified: isId ? "Terverifikasi" : "Verified",
    gradeLabel: isId ? "Grade Pasokan:" : "Supplied Grades:",
    fallbackText: isId ? "Jadilah koperasi pertama yang bergabung" : "Be the first cooperative to join",
    cta: isId ? "Lihat semua supplier" : "View all suppliers",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatGrades = (grades: string[]) => {
    if (!grades || grades.length === 0) return "-";
    return grades
      .map((g) => g.replace("GRADE_", ""))
      .join(", ");
  };

  return (
    <section className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-20 bg-emerald-50/50 border-t border-b border-emerald-100/30 relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h2 className="text-xl md:text-2xl font-bold font-sans text-zinc-800 uppercase tracking-wider">
            {content.title}
          </h2>
        </div>

        {loading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-md animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-zinc-200 rounded w-3/4" />
                    <div className="h-3 bg-zinc-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-zinc-200 rounded w-full pt-2" />
              </div>
            ))}
          </div>
        ) : suppliers.length > 0 ? (
          /* Cooperative Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    {supplier.user?.profile?.avatar_url ? (
                      <img
                        src={supplier.user.profile.avatar_url}
                        alt={supplier.nama_koperasi}
                        className="w-12 h-12 rounded-full object-cover border border-zinc-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                        {getInitials(supplier.nama_koperasi)}
                      </div>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {content.badgeVerified}
                    </span>
                  </div>

                  <h3 className="font-bold text-zinc-900 text-lg leading-snug mb-1">
                    {supplier.nama_koperasi}
                  </h3>
                  <p className="text-sm text-zinc-500 mb-4">
                    {supplier.kabupaten}, Aceh
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-50 text-xs md:text-sm">
                  <span className="text-zinc-400 block mb-0.5">{content.gradeLabel}</span>
                  <span className="font-semibold text-emerald-800 font-mono">
                    Grade {formatGrades(supplier.grade_nilam)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty Placeholder */
          <div className="text-center py-12 max-w-md mx-auto">
            <div className="bg-white border border-dashed border-zinc-200 rounded-3xl p-8 shadow-sm">
              <p className="text-zinc-500 font-medium mb-4">
                {content.fallbackText}
              </p>
              <Link href={`/${locale}/register`}>
                <button className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-full px-6 py-2.5 transition-colors">
                  {locale === "id" ? "Daftar Sekarang" : "Register Now"}
                </button>
              </Link>
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href={`/${locale}/marketplace`}
            className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-semibold hover:underline transition-colors group"
          >
            {content.cta}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
