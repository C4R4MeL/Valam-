"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { qualityApi, statusLabel } from "@/lib/quality";

export function ReportSummary({
  report,
  privateSource = false,
  onOpen,
}: {
  report: any;
  privateSource?: boolean;
  onOpen?: (download: boolean) => void;
}) {
  const id = useLocale() === "id";
  const missing = id ? "Tidak tersedia" : "Unavailable";
  const source = `${qualityApi}/quality/reports/${report.id}/source`;
  return (
    <div className="space-y-3 break-words">
      <p className="font-semibold text-emerald-800">
        {report.is_demo
          ? id
            ? "DEMONSTRASI"
            : "DEMONSTRATION"
          : report.review_status === "APPROVED"
            ? `${id ? "Diuji oleh" : "Tested by"} ${report.issuer_snapshot?.name || missing}`
            : statusLabel(report.review_status, id)}
      </p>
      <dl className="grid sm:grid-cols-2 gap-2 text-sm">
        <div>
          {id ? "Penerbit" : "Issuer"}:{" "}
          {report.issuer_snapshot?.name || missing}
        </div>
        <div>
          {id ? "Nomor laporan" : "Report number"}: {report.report_number}
        </div>
        <div>
          {id ? "Identitas sampel" : "Sample identity"}:{" "}
          {report.sample_identity}
        </div>
        <div>
          {id ? "Tanggal uji" : "Test date"}:{" "}
          {report.tested_at
            ? new Date(report.tested_at).toLocaleDateString(
                id ? "id-ID" : "en-GB",
              )
            : missing}
        </div>
        <div>
          {id ? "Tanggal terbit" : "Issue date"}:{" "}
          {report.issued_at
            ? new Date(report.issued_at).toLocaleDateString(
                id ? "id-ID" : "en-GB",
              )
            : missing}
        </div>
      </dl>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              {(id
                ? ["Parameter", "Nilai", "Satuan", "Metode"]
                : ["Parameter", "Value", "Unit", "Method"]
              ).map((t) => (
                <th key={t} className="p-2">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.parameters?.map((p: any, i: number) => (
              <tr key={i} className="border-t">
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.value}</td>
                <td className="p-2">{p.unit || missing}</td>
                <td className="p-2">{p.method || missing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!report.parameters?.length && (
        <p>
          {id ? "Parameter belum tersedia." : "Parameters are unavailable."}
        </p>
      )}
      <p className="text-sm">
        {id ? "Kesimpulan laboratorium" : "Laboratory conclusion"}:{" "}
        {report.conclusion || missing}
      </p>
      <p className="text-sm text-zinc-600">
        {id
          ? "Evaluasi terhadap standar: Belum dievaluasi. Pemeriksaan VALAM mencatat keterkaitan dokumen dengan batch. Hasil berasal dari laboratorium dan terbatas pada sampel serta parameter dalam laporan."
          : "Standards evaluation: Not evaluated. VALAM reviews document association with the batch. Laboratory results apply to the sample and parameters in the report."}
      </p>
      <div className="flex flex-wrap gap-4 text-sm text-emerald-800 underline">
        {privateSource ? (
          <>
            <button onClick={() => onOpen?.(false)}>
              {id ? "Pratinjau asli" : "Preview original"}
            </button>
            <button onClick={() => onOpen?.(true)}>
              {id ? "Unduh asli" : "Download original"}
            </button>
          </>
        ) : (
          <>
            <a href={source} target="_blank" rel="noreferrer">
              {id ? "Pratinjau asli" : "Preview original"}
            </a>
            <a href={`${source}?download=1`} download>
              {id ? "Unduh asli" : "Download original"}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
export function BatchReports({ productId }: { productId: string }) {
  const id = useLocale() === "id";
  const [reports, setReports] = useState<any[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let mounted = true;
    const load = () =>
      fetch(`${qualityApi}/quality/batches/${productId}/reports`, {
        cache: "no-store",
      })
        .then((r) => {
          if (!r.ok) throw Error();
          return r.json();
        })
        .then((rows) => {
          if (mounted) {
            setReports(rows);
            setError(false);
          }
        })
        .catch(() => {
          if (mounted) {
            setReports([]);
            setError(true);
          }
        });
    load();
    const timer = setInterval(load, 30000);
    window.addEventListener("focus", load);
    return () => {
      mounted = false;
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [productId]);
  return (
    <section
      id="batch-reports"
      className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-7 space-y-5"
    >
      <h2 className="font-serif text-xl font-bold text-emerald-950">
        {id ? "Informasi Hasil Uji" : "Test Report Information"}
      </h2>
      {reports.map((report) => (
        <article key={report.id} className="border-b pb-5 last:border-0">
          <ReportSummary report={report} />
        </article>
      ))}
      {!reports.length && (
        <p className="text-sm text-zinc-600">
          {error
            ? id
              ? "Informasi laporan belum dapat dimuat. Coba lagi."
              : "Report information could not be loaded. Please retry."
            : id
              ? "Belum ada dokumen hasil uji yang telah diperiksa dan diizinkan untuk publikasi pada batch ini."
              : "No reviewed test report is authorized for publication for this batch yet."}
        </p>
      )}
      <p className="text-xs text-zinc-500">
        {id
          ? "QR mengarah ke catatan batch terkini; bukan pengesahan digital mitra."
          : "The QR links to current batch records; it is not a digital endorsement by the partner."}
      </p>
    </section>
  );
}
