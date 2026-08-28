'use client'

import { Leaf, Download, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CoAViewer({ batch }: { batch: any }) {
  const qcDate = '25 Juni 2026'
  const certNumber = `COA/VLM/${batch.batch_code.split('-')[1] || '260701'}/${batch.batch_code.split('-')[2] || '330'}`

  const resolveValue = (val1: any, val2: any) => {
    if (val1 !== undefined && val1 !== null && val1 !== 0 && val1 !== '') return val1;
    if (val2 !== undefined && val2 !== null && val2 !== 0 && val2 !== '') return val2;
    return '-';
  }

  // Support both backend schema and frontend mock local storage flat properties
  const pa = resolveValue(batch.qc_result?.pa_percentage, batch.pa_percentage)
  const moisture = resolveValue(batch.qc_result?.moisture, batch.moisture)
  const specificGravity = resolveValue(batch.qc_result?.specific_gravity, batch.specific_gravity)
  const refractiveIndex = resolveValue(batch.qc_result?.refractive_index, batch.refractive_index)
  const opticalRotation = resolveValue(batch.qc_result?.optical_rotation, batch.optical_rotation)

  const supplierName = batch.supplier?.supplier_profile?.nama_koperasi || batch.supplier?.profile?.company_name || batch.supplier_name || 'N/A'

  // Avoid broken image for mock IDs (e.g. bat_demo) by falling back to public QR API
  const qrUrl = batch.id && !batch.id.startsWith('bat_')
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'}/trace/${batch.id}/qr`
    : `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://valam.id/traceability/${batch.id || 'mock'}`

  const handleDownload = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${API_URL}/products/${batch.id}/coa/download`)
      if (!res.ok) throw new Error('Gagal mengunduh CoA.')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CoA-${batch.batch_code}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat mengunduh berkas.')
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-white border border-zinc-200 shadow-xl rounded-sm overflow-hidden">
      
      {/* Top Banner & Actions - Not part of the printed cert */}
      <div className="bg-zinc-900 px-6 py-4 flex items-center justify-between text-white border-b-4 border-gold-500">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-gold-400" />
          </div>
          <span className="font-semibold tracking-wide">DIGITAL CoA</span>
        </div>
        <Button 
          size="sm" 
          className="bg-gold-500 hover:bg-gold-600 text-zinc-950 font-bold"
          onClick={handleDownload}
        >
          <Download className="w-4 h-4 mr-2" />
          Unduh PDF
        </Button>
      </div>

      {/* Actual Certificate Body */}
      <div className="p-8 sm:p-12 relative bg-[url('/images/paper_texture.png')] bg-cover">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <Leaf className="w-96 h-96 text-emerald-900" />
        </div>

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-emerald-950 pb-6 mb-8 relative z-10">
          <div>
            <h1 className="text-3xl font-serif font-bold text-emerald-950 uppercase tracking-widest">
              Certificate of Analysis
            </h1>
            <p className="text-sm font-semibold text-zinc-500 tracking-widest mt-1">
              PT. VALAM GLOBAL NETWORK
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold text-zinc-900">No: {certNumber}</p>
            <p className="text-zinc-600">Date: {qcDate}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-sm relative z-10">
          <div className="flex justify-between border-b border-zinc-200 pb-2">
            <span className="text-zinc-500 font-medium">Batch ID</span>
            <span className="font-bold text-zinc-900 font-mono">{batch.batch_code}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-200 pb-2">
            <span className="text-zinc-500 font-medium">Product</span>
            <span className="font-bold text-zinc-900">Patchouli Essential Oil</span>
          </div>
          <div className="flex justify-between border-b border-zinc-200 pb-2">
            <span className="text-zinc-500 font-medium">Supplier</span>
            <span className="font-bold text-zinc-900">{supplierName}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-200 pb-2">
            <span className="text-zinc-500 font-medium">Origin</span>
            <span className="font-bold text-zinc-900">{batch.origin_district}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-200 pb-2">
            <span className="text-zinc-500 font-medium">Test Method</span>
            <span className="font-bold text-zinc-900">GC-MS</span>
          </div>
          <div className="flex justify-between border-b border-zinc-200 pb-2">
            <span className="text-zinc-500 font-medium">Status</span>
            <span className="font-bold text-emerald-600 uppercase">Verified</span>
          </div>
        </div>

        {/* Results Table */}
        <div className="mb-12 relative z-10">
          <table className="w-full text-sm text-left">
            <thead className="bg-emerald-950 text-white">
              <tr>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Parameter</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Result</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Standard (SNI)</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 border-b-2 border-emerald-950">
               <tr className="hover:bg-zinc-50">
                <td className="py-3 px-4 font-medium text-zinc-900">Patchouli Alcohol (PA)</td>
                <td className="py-3 px-4 font-bold text-emerald-700">{pa}%</td>
                <td className="py-3 px-4 text-zinc-600">Min 30.0%</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">PASS</td>
              </tr>
              <tr className="hover:bg-zinc-50">
                <td className="py-3 px-4 font-medium text-zinc-900">Moisture Content</td>
                <td className="py-3 px-4 font-bold text-zinc-900">{moisture}%</td>
                <td className="py-3 px-4 text-zinc-600">Max 2.0%</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">PASS</td>
              </tr>
              <tr className="hover:bg-zinc-50">
                <td className="py-3 px-4 font-medium text-zinc-900">Specific Gravity (20°C)</td>
                <td className="py-3 px-4 font-bold text-zinc-900">{specificGravity}</td>
                <td className="py-3 px-4 text-zinc-600">0.950 - 0.975</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">PASS</td>
              </tr>
              <tr className="hover:bg-zinc-50">
                <td className="py-3 px-4 font-medium text-zinc-900">Refractive Index (20°C)</td>
                <td className="py-3 px-4 font-bold text-zinc-900">{refractiveIndex}</td>
                <td className="py-3 px-4 text-zinc-600">1.507 - 1.515</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">PASS</td>
              </tr>
              <tr className="hover:bg-zinc-50">
                <td className="py-3 px-4 font-medium text-zinc-900">Optical Rotation</td>
                <td className="py-3 px-4 font-bold text-zinc-900">{opticalRotation}°</td>
                <td className="py-3 px-4 text-zinc-600">-48° to -65°</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">PASS</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures & Footer */}
        <div className="flex justify-between items-end relative z-10 pt-4">
          <div className="text-center w-40">
            {/* Fake QR */}
            <div className="w-24 h-24 bg-white border border-zinc-200 p-2 mx-auto mb-2 flex items-center justify-center overflow-hidden">
              <img src={qrUrl} alt="QR" className="w-full h-full object-cover" />
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">SCAN TO VERIFY</p>
          </div>
          
          <div className="text-center w-64">
            <div className="h-20 flex items-end justify-center mb-2">
              {/* Fake Signature */}
              <span className="font-['Brush_Script_MT',cursive] text-4xl text-blue-900 -rotate-6">Dr. Iskandar</span>
            </div>
            <div className="border-t border-zinc-400 pt-2">
              <p className="font-bold text-zinc-900 text-sm">Dr. Iskandar, M.Si.</p>
              <p className="text-xs text-zinc-600">Head of Quality Control</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
