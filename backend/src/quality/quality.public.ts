import { Prisma } from '@prisma/client';
export const reviewedReportSelection = {
  where: {
    review_status: 'APPROVED',
    is_demo: false,
    publication_allowed: true,
    partner: { publish_reports: true, publish_name: true },
  },
  select: {
    id: true,
    issuer_snapshot: true,
    report_number: true,
    sample_identity: true,
    tested_at: true,
    issued_at: true,
    parameters: true,
    conclusion: true,
    reviewed_at: true,
  },
  orderBy: { created_at: 'desc' as const },
} satisfies Prisma.LabReportFindManyArgs;

/** Public scalar results must come from the same reviewed source as the badge. */
export function publicQuality(product: {
  is_demo: boolean;
  qc_result?: unknown;
  lab_reports?: any[];
}) {
  const reports = product.is_demo ? [] : product.lab_reports || [];
  const r = reports[0];
  const parameters: any[] = Array.isArray(r?.parameters) ? r.parameters : [];
  const value = (names: string[], units: string[]) => {
    const row = parameters.find((p) =>
      names.includes(String(p.name).trim().toLowerCase()),
    );
    const raw = String(row?.value ?? '');
    if (
      !row ||
      !units.includes(
        String(row.unit ?? '')
          .trim()
          .toLowerCase(),
      )
    )
      return null;
    return /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(raw) &&
      Number.isFinite(Number(raw))
      ? Number(raw)
      : null;
  };
  const metrics = {
    pa_percentage: value(
      ['pa', 'patchouli alcohol', 'patchouli alcohol (pa)'],
      ['%'],
    ),
    moisture: value(['moisture', 'kadar air'], ['%']),
    specific_gravity: value(
      ['specific gravity', 'bobot jenis'],
      ['', '-', '1'],
    ),
    refractive_index: value(
      ['refractive index', 'indeks bias'],
      ['', '-', '1'],
    ),
    optical_rotation: value(
      ['optical rotation', 'rotasi optik'],
      ['°', 'deg', 'degrees'],
    ),
  };
  return {
    ...metrics,
    lab_verified: !!r,
    testing_issuer: r?.issuer_snapshot?.name || null,
    quality_status: 'UNEVALUATED',
    document_review_status: r
      ? 'APPROVED'
      : product.qc_result
        ? 'NEEDS_REVIEW'
        : 'NOT_AVAILABLE',
    tested_at: r?.tested_at || null,
    qc_result: r
      ? {
          ...metrics,
          lab_name: r.issuer_snapshot?.name,
          report_number: r.report_number,
          tested_at: r.tested_at,
          overall_status: 'UNEVALUATED',
        }
      : null,
  };
}
