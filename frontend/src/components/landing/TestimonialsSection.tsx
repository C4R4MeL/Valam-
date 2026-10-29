"use client";
import { useLocale } from "next-intl";
export function TestimonialsSection() {
  const isId = useLocale() === 'id';
  return <section className="py-14 border-t border-zinc-200"><div className="container mx-auto px-4 max-w-5xl"><h2 className="text-2xl font-bold text-zinc-900">{isId ? 'Ulasan Pengguna' : 'User Reviews'}</h2><p className="mt-3 text-sm text-zinc-600">{isId ? 'Ulasan dan rating pengguna terverifikasi belum tersedia. Testimoni contoh tidak ditampilkan sebagai pengalaman pelanggan.' : 'Verified user reviews and ratings are unavailable. Sample testimonials are not presented as customer experiences.'}</p></div></section>;
}
