"use client";
import { FormEvent, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { qualityFetch, openQualityDocument, statusLabel } from "@/lib/quality";

const fresh = {
  name: "",
  kind: "LABORATORY",
  logo_url: "",
  address: "",
  contact: "",
  services: [],
  instructions: "",
  fees: "",
  sample_requirements: "",
  turnaround: "",
  result_channel: "",
  permission_notes: "",
  publish_name: false,
  publish_logo: false,
  publish_reports: false,
  visible: false,
  accepting_requests: false,
  status: "EXPLORATORY",
};
export function TestingPartnerManager() {
  const id = useLocale() === "id";
  const t = (a: string, b: string) => (id ? a : b);
  const [partners, setPartners] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ ...fresh });
  const [selected, setSelected] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = async () =>
    setPartners(await qualityFetch("manage/admin/partners"));
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  const edit = async (p: any) => {
    setSelected(p.id);
    setForm(
      Object.fromEntries(
        Object.keys(fresh).map((k) => [
          k,
          p[k] ?? fresh[k as keyof typeof fresh],
        ]),
      ),
    );
    setDetail(await qualityFetch(`manage/admin/partners/${p.id}`));
  };
  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    setMessage("");
    try {
      const payload = { ...form };
      if (!payload.logo_url) delete payload.logo_url;
      const p = await qualityFetch(
        `manage/admin/partners${selected ? `/${selected}` : ""}`,
        { method: selected ? "PATCH" : "POST", body: JSON.stringify(payload) },
      );
      await load();
      await edit(p);
      setMessage(t("Mitra tersimpan.", "Partner saved."));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await qualityFetch(`manage/admin/partners/${selected}/files`, {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      setDetail(await qualityFetch(`manage/admin/partners/${selected}`));
      setMessage(t("Dokumen internal tersimpan.", "Internal document saved."));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const fields = [
    ["name", "Nama mitra", "Partner name"],
    ["kind", "Jenis mitra", "Partner type"],
    ["logo_url", "URL logo resmi (https)", "Official logo URL (https)"],
    ["address", "Alamat (internal)", "Address (internal)"],
    ["contact", "Kontak (internal)", "Contact (internal)"],
    ["instructions", "Instruksi layanan", "Service instructions"],
    ["fees", "Biaya sesuai kesepakatan", "Agreed fees"],
    ["sample_requirements", "Kebutuhan sampel", "Sample requirements"],
    ["turnaround", "Waktu layanan", "Turnaround"],
    ["result_channel", "Saluran penyerahan hasil", "Result delivery channel"],
    [
      "permission_notes",
      "Catatan izin nama / logo / laporan",
      "Name / logo / report permission notes",
    ],
  ];
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
      <h1 className="font-serif text-2xl font-bold text-emerald-950">
        {t("Mitra Pengujian", "Testing Partners")}
      </h1>
      <p className="text-sm text-zinc-600">
        {t(
          "Isi hanya informasi resmi yang telah dikonfirmasi. Kolom kosong tetap tidak tersedia. Nonaktifkan penerimaan pengajuan untuk menghentikan layanan baru; riwayat laporan tetap tersimpan.",
          "Enter confirmed official information only. Empty fields remain unavailable. Disable request acceptance to stop new submissions while retaining report history.",
        )}
      </p>
      {error && (
        <p role="alert" className="text-red-800 bg-red-50 p-3 rounded-lg">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-emerald-800">
          {message}
        </p>
      )}
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="space-y-3">
          <Button
            disabled={busy}
            onClick={() => {
              setSelected("");
              setForm({ ...fresh });
              setDetail(null);
            }}
          >
            {t("Tambah mitra", "Add partner")}
          </Button>
          {partners.map((p) => (
            <button
              key={p.id}
              disabled={busy}
              onClick={() => edit(p).catch((e) => setError(e.message))}
              className={`block border rounded-xl p-4 w-full text-left ${selected === p.id ? "bg-emerald-50 border-emerald-700" : "bg-white"}`}
            >
              <strong>{p.name}</strong>
              <p className="text-sm mt-1">
                {statusLabel(p.status, id)} ·{" "}
                {p.accepting_requests
                  ? t("Menerima pengajuan", "Accepting requests")
                  : t("Pengajuan ditutup", "Requests closed")}
              </p>
            </button>
          ))}
        </aside>
        <div className="space-y-5">
          <form
            onSubmit={save}
            className="bg-white border rounded-2xl p-5 grid sm:grid-cols-2 gap-4"
          >
            {fields.map(([key, a, b]) => (
              <label key={key} className="text-sm space-y-1">
                <span>{t(a, b)}</span>
                {[
                  "instructions",
                  "permission_notes",
                  "sample_requirements",
                ].includes(key) ? (
                  <textarea
                    className="w-full rounded-lg border p-2"
                    rows={3}
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                ) : (
                  <Input
                    type={key === "logo_url" ? "url" : "text"}
                    required={key === "name" || key === "kind"}
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                )}
              </label>
            ))}
            <label className="text-sm space-y-1">
              <span>
                {t("Layanan (satu per baris)", "Services (one per line)")}
              </span>
              <textarea
                rows={4}
                className="w-full rounded-lg border p-2"
                value={form.services.join("\n")}
                onChange={(e) =>
                  setForm({ ...form, services: e.target.value.split("\n") })
                }
                onBlur={() =>
                  setForm({
                    ...form,
                    services: form.services
                      .map((s: string) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <label className="text-sm space-y-1">
              <span>Status</span>
              <select
                className="w-full rounded-lg border p-2"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value,
                    ...(e.target.value !== "ACTIVE"
                      ? { accepting_requests: false }
                      : {}),
                  })
                }
              >
                {["EXPLORATORY", "ACTIVE", "SUSPENDED", "ENDED"].map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s, id)}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="sm:col-span-2 grid sm:grid-cols-2 gap-3 text-sm">
              {[
                [
                  "publish_name",
                  "Izin publikasi nama",
                  "Name publication permission",
                ],
                [
                  "publish_logo",
                  "Izin penggunaan logo resmi",
                  "Official logo permission",
                ],
                [
                  "publish_reports",
                  "Izin publikasi laporan",
                  "Report publication permission",
                ],
                ["visible", "Tampilkan pada website", "Show on website"],
                [
                  "accepting_requests",
                  "Menerima pengajuan baru",
                  "Accept new requests",
                ],
              ].map(([key, a, b]) => (
                <label key={key} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.checked })
                    }
                  />
                  {t(a, b)}
                </label>
              ))}
            </fieldset>
            <Button disabled={busy}>{t("Simpan mitra", "Save partner")}</Button>
          </form>
          {detail && (
            <section className="bg-white border rounded-2xl p-5 space-y-4">
              <h2 className="font-bold">
                {t(
                  "Detail dan dokumen kerja sama internal",
                  "Details and internal partnership documents",
                )}
              </h2>
              <p className="text-sm">
                {t("Pengajuan", "Requests")}: {detail._count.requests} ·{" "}
                {t("Laporan", "Reports")}: {detail._count.reports}
              </p>
              <p className="text-sm text-zinc-600">
                {t(
                  "Dokumen ini hanya dapat diakses admin, terpisah dari laporan produk.",
                  "These documents are admin only and separate from product reports.",
                )}
              </p>
              {detail.files.map((f: any) => (
                <button
                  key={f.id}
                  className="block text-sm underline text-emerald-800"
                  onClick={() =>
                    openQualityDocument(
                      `manage/admin/agreements/${f.id}/source`,
                    ).catch((e) => setError(e.message))
                  }
                >
                  {f.name}
                </button>
              ))}
              <form
                onSubmit={upload}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Input
                  type="file"
                  name="file"
                  required
                  accept="application/pdf"
                  aria-label={t(
                    "Dokumen kerja sama internal",
                    "Internal agreement document",
                  )}
                />
                <Button disabled={busy}>
                  {t("Unggah PDF internal", "Upload internal PDF")}
                </Button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
