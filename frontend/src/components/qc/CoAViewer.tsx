'use client'

import { useLocale } from 'next-intl'
import { FileText } from 'lucide-react'

export function CoAViewer({ batch }: { batch: Record<string, any> }) {
  const id = useLocale() === 'id'
  const t = (a: string, b: string) => id ? a : b
  const missing = t('Belum tersedia', 'Unavailable')
  const qc = batch.qc_result || {}
  const values = [
    ['Patchouli Alcohol (PA)', qc.pa_percentage ?? batch.pa_percentage, '%'],
    ['Moisture', qc.moisture ?? batch.moisture, '%'],
    ['Specific Gravity', qc.specific_gravity ?? batch.specific_gravity, ''],
    ['Refractive Index', qc.refractive_index ?? batch.refractive_index, ''],
    ['Optical Rotation', qc.optical_rotation ?? batch.optical_rotation, '°'],
  ]
  const source = typeof qc.source_document_url === 'string' && qc.source_document_url.startsWith('https://') ? qc.source_document_url : null
  return (
    <div className="w-full max-w-3xl mx-auto bg-white border border-zinc-200 shadow-lg rounded-xl p-6 space-y-5">
      <h2 className="text-lg font-bold flex gap-2 items-center"><FileText /> {t('Ringkasan Informasi Hasil Uji', 'Test Result Information Summary')}</h2>
      <p className="text-sm text-amber-800">{batch.is_demo ? t('DATA DEMONSTRASI. ', 'DEMONSTRATION DATA. ') : ''}{t('Belum dievaluasi. Catatan lama perlu ditinjau. Ringkasan ini bukan CoA resmi laboratorium.', 'Not evaluated. Legacy records require review. This summary is not an official laboratory CoA.')}</p>
      <dl className="text-sm space-y-1">
        <div>Batch: {batch.batch_code  || missing}</div>
        <div>{t('Laboratorium', 'Laboratory')}: {qc.lab_name  || missing}</div>
        <div>{t('Nomor laporan', 'Report number')}: {qc.report_number  || missing}</div>
        <div>{t('Tanggal uji', 'Test date')}: {qc.tested_at ? new Date(qc.tested_at).toLocaleDateString(id ? 'id-ID' : 'en-GB') : missing}</div>
      </dl>
      <table className="w-full text-sm text-left">
        <thead><tr><th className="p-2">Parameter</th><th className="p-2">{t('Hasil tercatat', 'Recorded result')}</th><th className="p-2">{t('Evaluasi', 'Evaluation')}</th></tr></thead>
        <tbody>{values.map(([name, value, unit]) => <tr key={name} className="border-t border-zinc-100">
          <td className="p-2">{name}</td><td className="p-2">{value == null || value === '' ? missing : String(value) + unit}</td><td className="p-2">{t('Belum dievaluasi', 'Not evaluated')}</td>
        </tr>)}</tbody>
      </table>
      {source ? <a href={source} target="_blank" rel="noopener noreferrer" className="underline text-emerald-800">{t('Dokumen sumber lama — perlu ditinjau', 'Legacy source — requires review')}</a> : <p className="text-sm text-zinc-500">{t('Dokumen sumber belum tersedia. Tidak ada nomor laporan atau penandatangan contoh.', 'Source document unavailable. No example report numbers or signers are supplied.')}</p>}
    </div>
  )
}
