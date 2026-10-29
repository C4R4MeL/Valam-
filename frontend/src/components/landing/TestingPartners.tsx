"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { qualityApi } from "@/lib/quality";
export function TestingPartners() {
  const id = useLocale() === "id";
  const [partners, setPartners] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${qualityApi}/quality/partners`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setPartners)
      .catch(() => setPartners([]));
  }, []);
  return (
    <section id="testing-partners" className="max-w-7xl mx-auto px-5 py-12 space-y-5">
      <h2 className="font-serif text-2xl text-emerald-950 font-bold">
        {id ? "Mitra Pengujian" : "Testing Partners"}
      </h2>
      <p className="text-zinc-600 max-w-3xl">
        {id
          ? "VALAM mengelola platform dan koordinasi pencatatan. Mitra laboratorium menguji sampel dan menerbitkan dokumen hasil uji. Kemitraan tidak berarti seluruh produk telah diuji."
          : "VALAM manages the platform and coordinates records. Laboratory partners test samples and issue test reports. Partnership does not mean every product has been tested."}
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map((p) => (
          <article key={p.id} className="border rounded-2xl p-5 bg-white">
            {p.logo_url && (
              <img
                src={p.logo_url}
                alt={p.name}
                className="h-14 max-w-full object-contain mb-3"
              />
            )}
            <h3 className="font-semibold text-emerald-900">{p.name}</h3>
            <p className="text-sm text-zinc-600 mt-2">
              {p.services.length
                ? p.services.join(", ")
                : id
                  ? "Layanan menunggu konfirmasi admin."
                  : "Services await admin confirmation."}
            </p>
          </article>
        ))}
      </div>
      {!partners.length && (
        <p className="text-sm text-zinc-500">
          {id
            ? "Informasi mitra belum tersedia."
            : "Partner information is unavailable."}
        </p>
      )}
    </section>
  );
}
