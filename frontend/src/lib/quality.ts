export const qualityApi =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001/api";
export async function qualityFetch(path: string, init: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("valam_token") : null;
  const response = await fetch(`${qualityApi}/quality/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      Array.isArray(error.message)
        ? error.message.join(", ")
        : error.message || `HTTP ${response.status}`,
    );
  }
  return response.json();
}
export const qualityStatuses: Record<string, [string, string]> = {
  SUBMITTED: ["Diajukan", "Submitted"],
  AWAITING_SHIPMENT: ["Menunggu pengiriman sampel", "Awaiting sample shipment"],
  SHIPPED: ["Sampel dikirim", "Sample shipped"],
  RECEIVED: ["Sampel diterima", "Sample received"],
  TESTING: ["Dalam pengujian", "Testing"],
  RESULTS_AVAILABLE: ["Hasil tersedia", "Results available"],
  CANCELLED: ["Dibatalkan", "Cancelled"],
  PENDING: ["Menunggu pemeriksaan", "Pending review"],
  APPROVED: ["Dokumen diperiksa VALAM", "Document reviewed by VALAM"],
  REVISION_REQUESTED: ["Perlu perbaikan", "Correction required"],
  REJECTED: ["Keterkaitan ditolak", "Association rejected"],
  REVOKED: ["Dicabut", "Revoked"],
  SUPERSEDED: ["Digantikan", "Superseded"],
  EXPLORATORY: ["Penjajakan", "Exploratory"],
  ACTIVE: ["Aktif", "Active"],
  SUSPENDED: ["Ditangguhkan", "Suspended"],
  ENDED: ["Berakhir", "Ended"],
  UNEVALUATED: ["Belum dievaluasi", "Not evaluated"],
};
export const statusLabel = (status: string, id: boolean) =>
  qualityStatuses[status]?.[id ? 0 : 1] || status;

export async function openQualityDocument(path: string, download = false) {
  const token = localStorage.getItem("valam_token");
  // Fetch with the Authorization header; never put session tokens in a document URL.
  const response = await fetch(
    `${qualityApi}/quality/${path}${download ? "?download=1" : ""}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new Error(`Document unavailable (${response.status})`);
  const url = URL.createObjectURL(await response.blob());
  if (download) {
    const a = document.createElement("a");
    a.href = url;
    a.download = "laboratory-source.pdf";
    a.click();
  } else window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
