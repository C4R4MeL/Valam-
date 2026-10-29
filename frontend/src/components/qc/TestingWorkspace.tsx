"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { qualityFetch, openQualityDocument, statusLabel } from "@/lib/quality";
import { ReportSummary } from "./BatchReports";
import { CoAViewer } from "./CoAViewer";

const steps: Record<string, string[]> = {
  SUBMITTED: ["AWAITING_SHIPMENT", "CANCELLED"],
  AWAITING_SHIPMENT: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["RECEIVED", "CANCELLED"],
  RECEIVED: ["TESTING", "CANCELLED"],
  TESTING: ["CANCELLED"],
};
export function TestingWorkspace({ admin = false }: { admin?: boolean }) {
  const id = useLocale() === "id";
  const t = (a: string, b: string) => (id ? a : b);
  const [data, setData] = useState<any>({
    requests: [],
    reports: [],
    batches: [],
    notifications: [],
  });
  const [partners, setPartners] = useState<any[]>([]);
  const [issuers, setIssuers] = useState<any[]>([]);
  const [partnerId, setPartnerId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [reportRequest, setReportRequest] = useState("");
  const [replacement, setReplacement] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const requestKey = useRef("");
  const reportKey = useRef("");
  const refresh = useCallback(async () => {
    const [workspace, options, publishers] = await Promise.all([
      qualityFetch("manage"),
      qualityFetch("manage/partners"),
      qualityFetch("manage/issuers"),
    ]);
    setData(workspace);
    setPartners(options);
    setIssuers(publishers);
  }, []);
  useEffect(() => {
    requestKey.current = crypto.randomUUID();
    reportKey.current = crypto.randomUUID();
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refresh]);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await action();
      await refresh();
      setSuccess(t("Tersimpan.", "Saved."));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const partner = partners.find((p) => p.id === partnerId);
  const empty = t("Menunggu konfirmasi admin", "Awaiting admin confirmation");
  const label = (text: string, child: React.ReactNode) => (
    <label className="block text-sm space-y-1">
      <span>{text}</span>
      {child}
    </label>
  );
  const selectClass =
    "w-full border border-zinc-300 rounded-lg p-2 bg-white text-sm";
  async function request(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    await run(async () => {
      await qualityFetch("manage/requests", {
        method: "POST",
        body: JSON.stringify({
          product_id: String(f.get("product_id")),
          partner_id: partnerId,
          service: String(f.get("service")),
          sample_identity: String(f.get("sample_identity") || ""),
          notes: String(f.get("notes") || ""),
          key: requestKey.current,
        }),
      });
      requestKey.current = crypto.randomUUID();
      form.reset();
      setPartnerId("");
    });
  }
  async function report(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    await run(async () => {
      const rows = String(f.get("parameters") || "")
        .split("\n")
        .filter((x) => x.trim())
        .map((row) => {
          const [name, value, unit, method] = row
            .split("|")
            .map((x) => x.trim());
          if (!name || !value)
            throw Error(
              t(
                "Isi parameter dan nilai pada setiap baris.",
                "Each row needs a parameter and value.",
              ),
            );
          return { name, value, unit, method };
        });
      const upload = new FormData();
      upload.append("file", f.get("file") as File);
      const file = await qualityFetch(`manage/batches/${batchId}/files`, {
        method: "POST",
        body: upload,
      });
      const payload: any = {
        product_id: batchId,
        partner_id: String(f.get("partner_id")),
        file_id: file.id,
        report_number: String(f.get("report_number")),
        sample_identity: String(f.get("sample_identity")),
        parameters: rows,
        conclusion: String(f.get("conclusion") || ""),
        source: String(f.get("source")),
        publication_allowed: f.get("publication_allowed") === "on",
        is_demo: f.get("is_demo") === "on",
        key: reportKey.current,
      };
      if (reportRequest) payload.request_id = reportRequest;
      if (replacement) payload.replaces_id = replacement;
      for (const field of ["tested_at", "issued_at"])
        if (f.get(field)) payload[field] = f.get(field);
      await qualityFetch("manage/reports", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      reportKey.current = crypto.randomUUID();
      form.reset();
      setReportRequest("");
      setReplacement("");
      setBatchId("");
    });
  }
  async function transition(e: FormEvent<HTMLFormElement>, r: any) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload: any = {
      status: f.get("status"),
      notes: f.get("notes"),
      key: crypto.randomUUID(),
    };
    if (f.get("evidence")) payload.evidence = f.get("evidence");
    if (f.get("shipping_info")) payload.shipping_info = f.get("shipping_info");
    await run(async () => {
      await qualityFetch(`manage/requests/${r.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    });
  }
  async function review(e: FormEvent<HTMLFormElement>, r: any) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload: any = {
      status: f.get("status"),
      notes: f.get("notes"),
      key: crypto.randomUUID(),
    };
    if (payload.status === "APPROVED")
      payload.checklist = Object.fromEntries(
        [
          "issuer",
          "batch_sample",
          "report_number",
          "dates",
          "completeness",
        ].map((k) => [k, f.get(k) === "on"]),
      );
    await run(async () => {
      await qualityFetch(`manage/reports/${r.id}/review`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    });
  }
  function history(events: any[]) {
    return (
      <ol className="border-l-2 border-emerald-100 pl-4 space-y-3 text-xs">
        {events.map((event) => (
          <li key={event.id}>
            <strong>{statusLabel(event.action, id)}</strong> ·{" "}
            {new Date(event.created_at).toLocaleString(id ? "id-ID" : "en-GB")}{" "}
            · {event.actor_role}
            <p className="whitespace-pre-wrap">{event.notes}</p>
            {event.evidence && (
              <a
                className="underline"
                target="_blank"
                rel="noreferrer"
                href={event.evidence}
              >
                {t("Bukti pendukung", "Supporting evidence")}
              </a>
            )}
          </li>
        ))}
      </ol>
    );
  }
  if (loading) return <p className="p-6">{t("Memuat…", "Loading…")}</p>;
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-7 text-zinc-800">
      <header>
        <h1 className="text-2xl font-serif font-bold text-emerald-950">
          {t("Pengujian & Dokumen Mutu", "Testing & Quality Documents")}
        </h1>
        <p className="text-sm mt-2 text-zinc-600">
          {t(
            "Admin mencatat progres berdasarkan konfirmasi mitra. Akun laboratorium belum digunakan pada tahap ini. Pengajuan bukan konfirmasi pengiriman atau penerimaan sampel.",
            "Admin records progress from partner confirmation. Laboratory accounts are not used at this stage. Submitting a request does not confirm sample shipment or receipt.",
          )}
        </p>
      </header>
      <div className="flex gap-4 flex-wrap text-sm text-emerald-800 underline">
        <Link
          href={
            admin
              ? "/dashboard/admin/testing-partners"
              : "/dashboard/supplier/add-batch"
          }
        >
          {admin
            ? t("Mitra Pengujian", "Testing Partners")
            : t("Daftarkan batch baru", "Register a new batch")}
        </Link>
        <button disabled={busy} onClick={() => run(refresh)}>
          {t("Muat ulang", "Refresh")}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="bg-red-50 text-red-800 p-4 rounded-xl break-words"
        >
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-emerald-800">
          {success}
        </p>
      )}
      {!admin && (
        <section className="bg-white p-5 rounded-2xl border space-y-3">
          <h2 className="font-bold">
            {t("Notifikasi dalam aplikasi", "In-app notifications")}
          </h2>
          {!data.notifications?.length && (
            <p className="text-sm">
              {t(
                "Belum ada notifikasi pengujian.",
                "No testing notifications yet.",
              )}
            </p>
          )}
          {!!data.notifications?.length && (
            <details>
              <summary className="cursor-pointer text-sm text-emerald-800">
                {t("Lihat notifikasi", "View notifications")} (
                {data.notifications.length})
              </summary>
              <div className="space-y-3 max-h-72 overflow-y-auto mt-3">
                {data.notifications.map((n: any) => (
                  <article key={n.id} className="text-sm border-t pt-2">
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <time>{new Date(n.created_at).toLocaleString()}</time>
                  </article>
                ))}
              </div>
            </details>
          )}
        </section>
      )}
      {!!data.legacy_records?.length && (
        <section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-bold">
            {t(
              "Catatan lama — perlu ditinjau",
              "Legacy records — require review",
            )}
          </h2>
          <p className="text-sm">
            {t(
              "Catatan ini tidak menjadi laporan mitra secara otomatis. Unggah dokumen sumber asli melalui formulir laporan untuk pemeriksaan baru.",
              "These records do not automatically become partner reports. Upload the original source through the report form for a new review.",
            )}
          </p>
          {data.legacy_records.map((batch: any) => (
            <CoAViewer key={batch.id} batch={batch} />
          ))}
        </section>
      )}
      {!admin && (
        <section className="bg-white p-5 rounded-2xl border">
          <h2 className="font-bold mb-4">
            {t("Ajukan pengujian", "Request testing")}
          </h2>
          <form onSubmit={request} className="grid sm:grid-cols-2 gap-4">
            {label(
              "Batch",
              <select name="product_id" required className={selectClass}>
                <option value="">
                  {t("Pilih batch milik Anda", "Choose your batch")}
                </option>
                {data.batches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_code}
                  </option>
                ))}
              </select>,
            )}
            {label(
              t("Mitra tujuan", "Testing partner"),
              <select
                required
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className={selectClass}
              >
                <option value="">{t("Pilih mitra", "Choose partner")}</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>,
            )}
            {label(
              t("Layanan", "Service"),
              <select
                name="service"
                required
                key={partnerId}
                className={selectClass}
              >
                <option value="">{t("Pilih layanan", "Choose service")}</option>
                {partner?.services.map((s: string) => (
                  <option key={s}>{s}</option>
                ))}
              </select>,
            )}
            {label(
              t("Identitas sampel (opsional)", "Sample identity (optional)"),
              <Input name="sample_identity" maxLength={255} />,
            )}
            {label(
              t("Catatan pemohon", "Applicant notes"),
              <Input name="notes" />,
            )}
            <div className="sm:col-span-2 bg-amber-50 rounded-xl p-4 text-sm space-y-1">
              {[
                ["Instruksi", "Instructions", "instructions"],
                ["Biaya", "Fees", "fees"],
                [
                  "Kebutuhan sampel",
                  "Sample requirements",
                  "sample_requirements",
                ],
                ["Waktu layanan", "Turnaround", "turnaround"],
                ["Penyerahan hasil", "Result delivery", "result_channel"],
              ].map(([a, b, key]) => (
                <p key={key}>
                  <strong>{t(a, b)}:</strong> {partner?.[key] || empty}
                </p>
              ))}
              {!partners.length && (
                <p>
                  {t(
                    "Belum ada mitra yang menerima pengajuan. Hubungi admin.",
                    "No partner currently accepts requests. Contact admin.",
                  )}
                </p>
              )}
            </div>
            <Button disabled={busy || !partner?.services.length}>
              {t("Ajukan pengujian", "Submit request")}
            </Button>
          </form>
        </section>
      )}
      <section className="space-y-4">
        <h2 className="font-bold text-lg">
          {t("Pengajuan dan riwayat proses", "Requests and process history")}
        </h2>
        {!data.requests.length && (
          <p>{t("Belum ada pengajuan.", "No requests yet.")}</p>
        )}
        {data.requests.map((r: any) => {
          const options = (steps[r.status] || []).filter(
            (s) =>
              admin ||
              s === "SHIPPED" ||
              (s === "CANCELLED" &&
                ["SUBMITTED", "AWAITING_SHIPMENT"].includes(r.status)),
          );
          return (
            <article
              key={r.id}
              className="bg-white border rounded-2xl p-5 space-y-4 break-words"
            >
              <h3 className="font-semibold">
                {r.product.batch_code} · {r.partner_snapshot?.name}
              </h3>
              <p className="text-xs font-mono break-all">{r.number}</p>
              <p>
                {statusLabel(r.status, id)} · {r.service}
              </p>
              <p className="text-sm">
                {t("Sampel", "Sample")}:{" "}
                {r.sample_identity || t("Tidak tersedia", "Unavailable")}
              </p>
              <p className="text-sm">{r.notes}</p>
              {r.shipping_info && (
                <p className="text-sm">
                  {t("Pengiriman", "Shipping")}: {r.shipping_info}
                </p>
              )}
              {history(r.events)}
              {options.length > 0 && (
                <form
                  onSubmit={(e) => transition(e, r)}
                  className="grid sm:grid-cols-2 gap-3"
                >
                  {label(
                    t("Status berikutnya", "Next status"),
                    <select name="status" className={selectClass}>
                      {options.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(s, id)}
                        </option>
                      ))}
                    </select>,
                  )}
                  {label(
                    t(
                      "Alasan / konfirmasi mitra",
                      "Reason / partner confirmation",
                    ),
                    <Input name="notes" required />,
                  )}
                  {label(
                    t(
                      "Informasi pengiriman (wajib saat dikirim)",
                      "Shipping information (required for shipment)",
                    ),
                    <Input name="shipping_info" />,
                  )}
                  {label(
                    t(
                      "URL bukti pendukung (opsional)",
                      "Evidence URL (optional)",
                    ),
                    <Input type="url" name="evidence" pattern="https://.*" />,
                  )}
                  <Button disabled={busy}>
                    {t("Catat status", "Record status")}
                  </Button>
                </form>
              )}
            </article>
          );
        })}
      </section>
      <section
        id="upload-report"
        className="bg-white p-5 rounded-2xl border space-y-4"
      >
        <h2 className="font-bold">
          {t("Unggah laporan asli", "Upload original report")}
        </h2>
        <p className="text-sm text-zinc-600">
          {t(
            "Laporan yang sudah dimiliki dapat diunggah tanpa pengajuan. Tidak dibuat riwayat pengiriman atau pengujian fiktif. Semua unggahan menunggu pemeriksaan admin.",
            "Existing reports can be uploaded without a request. No shipment or testing history is invented. Every upload awaits admin review.",
          )}
        </p>
        <form onSubmit={report} className="grid sm:grid-cols-2 gap-4">
          {label(
            "Batch",
            <select
              required
              value={batchId}
              onChange={(e) => {
                setBatchId(e.target.value);
                setReportRequest("");
                setReplacement("");
              }}
              className={selectClass}
            >
              <option value="">{t("Pilih batch", "Choose batch")}</option>
              {data.batches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.batch_code}
                </option>
              ))}
            </select>,
          )}
          {label(
            t("Mitra penerbit sesuai dokumen", "Issuer as stated in document"),
            <select name="partner_id" required className={selectClass}>
              <option value="">{t("Pilih penerbit", "Choose issuer")}</option>
              {issuers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>,
          )}
          {label(
            t("Pengajuan terkait (opsional)", "Related request (optional)"),
            <select
              value={reportRequest}
              onChange={(e) => setReportRequest(e.target.value)}
              className={selectClass}
            >
              <option value="">
                {t(
                  "Laporan sudah dimiliki / tanpa pengajuan",
                  "Existing report / no request",
                )}
              </option>
              {data.requests
                .filter(
                  (r: any) =>
                    r.product_id === batchId && r.status !== "CANCELLED",
                )
                .map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.number}
                  </option>
                ))}
            </select>,
          )}
          {label(
            t("Menggantikan laporan (opsional)", "Replaces report (optional)"),
            <select
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              className={selectClass}
            >
              <option value="">{t("Laporan baru", "New report")}</option>
              {data.reports
                .filter((r: any) => r.product_id === batchId)
                .map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.report_number} · {statusLabel(r.review_status, id)}
                  </option>
                ))}
            </select>,
          )}
          {label(
            t("Nomor laporan resmi", "Official report number"),
            <Input required name="report_number" maxLength={255} />,
          )}
          {label(
            t("Identitas sampel sesuai dokumen", "Sample identity in document"),
            <Input required name="sample_identity" maxLength={255} />,
          )}
          {label(
            t("Tanggal uji (jika tercantum)", "Test date (if stated)"),
            <Input type="date" name="tested_at" />,
          )}
          {label(
            t("Tanggal terbit (jika tercantum)", "Issue date (if stated)"),
            <Input type="date" name="issued_at" />,
          )}
          {label(
            t("Sumber penerimaan dokumen", "Document receipt source"),
            <Input
              name="source"
              required
              placeholder={t(
                "Catat saluran dan sumber sebenarnya",
                "Record the actual source and channel",
              )}
            />,
          )}
          {label(
            t(
              "File sumber asli PDF, maksimal 5 MB",
              "Original PDF, maximum 5 MB",
            ),
            <Input required type="file" name="file" accept="application/pdf" />,
          )}
          <div className="sm:col-span-2">
            {label(
              t(
                "Parameter sesuai dokumen: satu baris = nama | nilai | satuan | metode (boleh kosong)",
                "Parameters as documented: one row = name | value | unit | method (may be empty)",
              ),
              <textarea name="parameters" rows={4} className={selectClass} />,
            )}
          </div>
          {label(
            t(
              "Kesimpulan persis sesuai dokumen (jika tersedia)",
              "Conclusion as stated in document (if available)",
            ),
            <textarea name="conclusion" className={selectClass} />,
          )}
          <div className="space-y-3 text-sm">
            <label className="flex gap-2">
              <input type="checkbox" name="publication_allowed" />
              {t(
                "Dokumen diizinkan untuk publikasi setelah diperiksa",
                "Publication permitted after review",
              )}
            </label>
            <label className="flex gap-2">
              <input type="checkbox" name="is_demo" />
              {t("Dokumen demonstrasi", "Demonstration document")}
            </label>
          </div>
          <Button disabled={busy || !batchId}>
            {t("Unggah untuk pemeriksaan", "Submit for review")}
          </Button>
        </form>
      </section>
      <section className="space-y-4">
        <h2 className="font-bold text-lg">
          {t("Laporan dan pemeriksaan dokumen", "Reports and document review")}
        </h2>
        {!data.reports.length && (
          <p>{t("Belum ada laporan.", "No reports yet.")}</p>
        )}
        {data.reports.map((r: any) => (
          <article
            key={r.id}
            className="bg-white border rounded-2xl p-5 space-y-4"
          >
            <h3 className="font-bold">
              {r.product.batch_code} · {statusLabel(r.review_status, id)}
            </h3>
            <ReportSummary
              report={r}
              privateSource
              onOpen={(download) =>
                run(async () => {
                  await openQualityDocument(
                    `manage/reports/${r.id}/source`,
                    download,
                  );
                })
              }
            />
            <p className="text-sm">
              {t("Catatan pemeriksa", "Reviewer notes")}:{" "}
              {r.review_notes || t("Belum tersedia", "Unavailable")}
            </p>
            {r.reviewed_at && (
              <p className="text-xs">
                {t("Pemeriksa", "Reviewer")}: {r.reviewed_by} ·{" "}
                {new Date(r.reviewed_at).toLocaleString()}
              </p>
            )}
            {history(r.events)}
            {admin && ["PENDING", "APPROVED"].includes(r.review_status) && (
              <form
                onSubmit={(e) => review(e, r)}
                className="grid sm:grid-cols-2 gap-3 bg-zinc-50 p-4 rounded-xl"
              >
                {label(
                  t("Keputusan pemeriksaan", "Review decision"),
                  <select name="status" className={selectClass}>
                    {(r.review_status === "APPROVED"
                      ? ["REVOKED"]
                      : ["REVISION_REQUESTED", "REJECTED", "APPROVED"]
                    ).map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s, id)}
                      </option>
                    ))}
                  </select>,
                )}
                {label(
                  t(
                    "Alasan dan catatan pemeriksaan",
                    "Review reason and notes",
                  ),
                  <Input name="notes" required />,
                )}
                {r.review_status === "PENDING" && (
                  <fieldset className="sm:col-span-2 space-y-2 text-sm">
                    <legend className="font-semibold mb-2">
                      {t(
                        "Wajib diperiksa sebelum persetujuan",
                        "Required checks before approval",
                      )}
                    </legend>
                    {[
                      ["issuer", "Penerbit", "Issuer"],
                      [
                        "batch_sample",
                        "Kecocokan batch dan sampel",
                        "Batch and sample match",
                      ],
                      ["report_number", "Nomor laporan", "Report number"],
                      [
                        "dates",
                        "Tanggal sesuai dokumen / ketiadaan dijelaskan pada catatan",
                        "Dates checked / absence explained in notes",
                      ],
                      [
                        "completeness",
                        "Kelengkapan dan sumber dokumen",
                        "Document completeness and source",
                      ],
                    ].map(([key, a, b]) => (
                      <label key={key} className="flex gap-2">
                        <input type="checkbox" name={key} />
                        {t(a, b)}
                      </label>
                    ))}
                  </fieldset>
                )}
                <Button disabled={busy}>
                  {t("Simpan pemeriksaan", "Save review")}
                </Button>
              </form>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
