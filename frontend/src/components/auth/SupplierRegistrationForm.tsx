'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sprout, FlaskConical, Building2, ChevronDown } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useState, useEffect } from 'react'

export type SupplierSubtype = 'PETANI' | 'PENYULING' | 'KOPERASI'

export interface SupplierFormData {
  supplierSubtype: SupplierSubtype | null;
  namaPic: string;
  ktpPic: string;
  whatsapp: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  namaKoperasi: string;
  nib: string;
  npwpSupplier: string;
  alamatLengkap: string;
  luasLahan: string;
  estimasiPanen: string;
  punyaAlatSuling: boolean;
  kapasitasProduksi: string;
  gradeNilam: string[];
  koperasiPembinaId: string;
  ktpError: string;
}

export const subtypeConfig = {
  PETANI: {
    icon: Sprout,
    labelId: 'Petani (Perorangan)',
    labelEn: 'Farmer (Individual)',
    descId: 'Petani nilam yang memiliki lahan dan menanam daun nilam',
    descEn: 'Patchouli farmer who owns land and grows patchouli leaves',
    color: 'emerald',
  },
  PENYULING: {
    icon: FlaskConical,
    labelId: 'Penyuling (Perorangan/UMKM)',
    labelEn: 'Distiller (Individual/MSME)',
    descId: 'Penyuling yang mengolah daun nilam menjadi minyak nilam',
    descEn: 'Distiller who processes patchouli leaves into patchouli oil',
    color: 'amber',
  },
  KOPERASI: {
    icon: Building2,
    labelId: 'Koperasi (Badan Hukum)',
    labelEn: 'Cooperative (Legal Entity)',
    descId: 'Koperasi dengan badan hukum resmi yang menaungi petani dan penyuling',
    descEn: 'Legally registered cooperative overseeing farmers and distillers',
    color: 'blue',
  },
}

interface SupplierRegistrationFormProps {
  data: SupplierFormData;
  onChange: (data: Partial<SupplierFormData>) => void;
  t: any; // translation object
}

export function SupplierRegistrationForm({ data, onChange, t }: SupplierRegistrationFormProps) {
  const locale = useLocale() as 'id' | 'en'
  const [koperasiList, setKoperasiList] = useState<Array<{ id: string; nama_koperasi: string; kabupaten: string }>>([])

  useEffect(() => {
    if (data.supplierSubtype === 'PETANI' || data.supplierSubtype === 'PENYULING') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
      fetch(`${apiUrl}/suppliers/koperasi-pembina`)
        .then(res => res.ok ? res.json() : { data: [] })
        .then(json => setKoperasiList(json.data || []))
        .catch(() => setKoperasiList([]))
    }
  }, [data.supplierSubtype])

  const validateKtp = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 16)
    let err = ''
    if (cleanValue && !/^\d{16}$/.test(cleanValue)) {
      err = t.validation?.nikLength || "NIK harus tepat 16 digit angka"
    }
    onChange({ ktpPic: cleanValue, ktpError: err })
  }

  const handleGradeToggle = (grade: string) => {
    const prev = data.gradeNilam || [];
    const newGrades = prev.includes(grade) 
      ? prev.filter(g => g !== grade)
      : [...prev, grade];
    onChange({ gradeNilam: newGrades });
  }

  return (
    <div className="space-y-4">
      {/* ── SUPPLIER SUB-TYPE SELECTOR ─────────────────────────── */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-emerald-900 font-semibold text-sm">{t.form?.subtypeTitle || 'Pilih Jenis Supplier'}</Label>
          <p className="text-xs text-zinc-500">{t.form?.subtypeSubtitle || 'Pilih peran yang sesuai dengan aktivitas Anda.'}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(subtypeConfig) as SupplierSubtype[]).map((key) => {
            const config = subtypeConfig[key]
            const Icon = config.icon
            const isSelected = data.supplierSubtype === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ supplierSubtype: key })}
                className={`
                  relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-300 text-center group
                  ${isSelected
                    ? 'border-emerald-600 bg-emerald-50 shadow-md shadow-emerald-100'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                  }
                `}
              >
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300
                  ${isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200'
                  }
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-emerald-800' : 'text-zinc-600'}`}>
                  {locale === 'en' ? config.labelEn.split(' (')[0] : config.labelId.split(' (')[0]}
                </span>
                <span className={`text-[10px] leading-tight ${isSelected ? 'text-emerald-600' : 'text-zinc-400'}`}>
                  {locale === 'en' ? `(${config.labelEn.split('(')[1]}` : `(${config.labelId.split('(')[1]}`}
                </span>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {data.supplierSubtype && (
        <div className="space-y-4 pt-2">
          {/* ── Section: Koperasi Identity (only KOPERASI) ───── */}
          {data.supplierSubtype === 'KOPERASI' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="namaKoperasi" className="text-emerald-900 font-semibold">{t.form?.namaKoperasi || 'Nama Koperasi'}</Label>
                <Input 
                  id="namaKoperasi" 
                  placeholder="Koperasi Tani Nilam Jaya"
                  value={data.namaKoperasi}
                  onChange={(e) => onChange({ namaKoperasi: e.target.value })}
                  className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nib" className="text-emerald-900 font-semibold">{t.form?.nibKoperasi || 'NIB'}</Label>
                  <Input 
                    id="nib" 
                    placeholder="NIB Koperasi"
                    value={data.nib}
                    onChange={(e) => onChange({ nib: e.target.value })}
                    className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="npwpSupplier" className="text-emerald-900 font-semibold">{t.form?.npwpKoperasi || 'NPWP'}</Label>
                  <Input 
                    id="npwpSupplier" 
                    placeholder="NPWP Koperasi"
                    value={data.npwpSupplier}
                    onChange={(e) => onChange({ npwpSupplier: e.target.value })}
                    className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                    required 
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Section: Nama & KTP (All sub-types) ──────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="namaPic" className="text-emerald-900 font-semibold">
                {data.supplierSubtype === 'KOPERASI' ? (t.form?.namaKetuaPic || 'Nama PIC') : (t.form?.namaLengkap || 'Nama Lengkap')}
              </Label>
              <Input 
                id="namaPic" 
                placeholder={data.supplierSubtype === 'KOPERASI' ? 'Nama Pengurus' : 'Nama sesuai KTP'}
                value={data.namaPic}
                onChange={(e) => onChange({ namaPic: e.target.value })}
                className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ktpPic" className="text-emerald-900 font-semibold">
                {data.supplierSubtype === 'KOPERASI' ? (t.form?.nikKtpPic || 'NIK KTP') : (t.form?.nikKtp || 'NIK KTP')}
              </Label>
              <Input 
                id="ktpPic" 
                placeholder="16 digit angka"
                value={data.ktpPic}
                onChange={(e) => validateKtp(e.target.value)}
                maxLength={16}
                className={`h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500 ${data.ktpError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                required 
              />
              {data.ktpError && (
                <p className="text-xs text-red-500 mt-1">{data.ktpError}</p>
              )}
            </div>
          </div>

          {/* ── Section: WhatsApp ──────────────────────────────── */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="text-emerald-900 font-semibold">{t.form?.whatsapp || 'WhatsApp'}</Label>
            <Input 
              id="whatsapp" 
              placeholder="Contoh: 08123456789"
              value={data.whatsapp}
              onChange={(e) => onChange({ whatsapp: e.target.value })}
              className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
              required 
            />
          </div>

          {/* ── Section: Lokasi (All sub-types) ───────────────── */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="desa" className="text-emerald-900 font-semibold">{t.form?.desa || 'Desa'}</Label>
              <Input 
                id="desa" 
                placeholder="Desa"
                value={data.desa}
                onChange={(e) => onChange({ desa: e.target.value })}
                className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kecamatan" className="text-emerald-900 font-semibold">{t.form?.kecamatan || 'Kecamatan'}</Label>
              <Input 
                id="kecamatan" 
                placeholder="Kecamatan"
                value={data.kecamatan}
                onChange={(e) => onChange({ kecamatan: e.target.value })}
                className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kabupaten" className="text-emerald-900 font-semibold">{t.form?.kabupaten || 'Kabupaten'}</Label>
              <Input 
                id="kabupaten" 
                placeholder="Kabupaten"
                value={data.kabupaten}
                onChange={(e) => onChange({ kabupaten: e.target.value })}
                className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                required 
              />
            </div>
          </div>

          {/* ── Section: Alamat Lengkap (KOPERASI only) ────────── */}
          {data.supplierSubtype === 'KOPERASI' && (
            <div className="space-y-2">
              <Label htmlFor="alamatLengkap" className="text-emerald-900 font-semibold">{t.form?.alamatLengkap || 'Alamat Lengkap'}</Label>
              <Input 
                id="alamatLengkap" 
                placeholder="Nama Jalan, RT/RW, Dusun"
                value={data.alamatLengkap}
                onChange={(e) => onChange({ alamatLengkap: e.target.value })}
                className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                required 
              />
            </div>
          )}

          {/* ── Section: Petani-specific fields ───────────────── */}
          {data.supplierSubtype === 'PETANI' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="luasLahan" className="text-emerald-900 font-semibold">{t.form?.luasLahan || 'Luas Lahan'}</Label>
                  <Input 
                    id="luasLahan" 
                    type="number"
                    step="0.1"
                    placeholder="Contoh: 2.5"
                    value={data.luasLahan}
                    onChange={(e) => onChange({ luasLahan: e.target.value })}
                    className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimasiPanen" className="text-emerald-900 font-semibold">{t.form?.estimasiPanen || 'Estimasi Panen'}</Label>
                  <Input 
                    id="estimasiPanen" 
                    type="number"
                    placeholder="Contoh: 500"
                    value={data.estimasiPanen}
                    onChange={(e) => onChange({ estimasiPanen: e.target.value })}
                    className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                    required 
                  />
                </div>
              </div>

              {/* ── Toggle: Punya Alat Suling ────────────────── */}
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/50 space-y-3">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-sm font-semibold text-emerald-900">{t.form?.punyaAlatSuling || 'Punya alat suling?'}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={data.punyaAlatSuling}
                    onClick={() => onChange({ punyaAlatSuling: !data.punyaAlatSuling })}
                    className={`
                      relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                      transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                      ${data.punyaAlatSuling ? 'bg-emerald-600' : 'bg-zinc-300'}
                    `}
                  >
                    <span className={`
                      pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 
                      transition-transform duration-300 ease-in-out
                      ${data.punyaAlatSuling ? 'translate-x-5' : 'translate-x-0'}
                    `} />
                  </button>
                </label>

                {/* ── Conditional Penyuling fields (reactive) ─── */}
                <div className={`
                  space-y-4 overflow-hidden transition-all duration-500 ease-in-out
                  ${data.punyaAlatSuling ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'}
                `}>
                  <div className="space-y-2">
                    <Label htmlFor="kapasitasProduksiPetani" className="text-emerald-900 font-semibold">{t.form?.kapasitasProduksi || 'Kapasitas'}</Label>
                    <Input 
                      id="kapasitasProduksiPetani" 
                      type="number"
                      placeholder="Contoh: 50"
                      value={data.kapasitasProduksi}
                      onChange={(e) => onChange({ kapasitasProduksi: e.target.value })}
                      className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                      required={data.punyaAlatSuling}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-emerald-900 font-semibold block">{t.form?.gradeNilam || 'Grade Nilam'}</Label>
                    <div className="flex gap-4">
                      {['GRADE_A', 'GRADE_B', 'GRADE_C'].map((g) => (
                        <label key={g} className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={data.gradeNilam?.includes(g)}
                            onChange={() => handleGradeToggle(g)}
                            className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{g === 'GRADE_A' ? 'A (PA≥32%)' : g === 'GRADE_B' ? 'B (PA28-31%)' : 'C (PA<28%)'}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Section: Penyuling-specific fields ────────────── */}
          {data.supplierSubtype === 'PENYULING' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nibPenyuling" className="text-emerald-900 font-semibold">{t.form?.nibOptional || 'NIB'}</Label>
                  <Input 
                    id="nibPenyuling" 
                    placeholder="NIB (opsional)"
                    value={data.nib}
                    onChange={(e) => onChange({ nib: e.target.value })}
                    className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="npwpPenyuling" className="text-emerald-900 font-semibold">{t.form?.npwpOptional || 'NPWP'}</Label>
                  <Input 
                    id="npwpPenyuling" 
                    placeholder="NPWP (opsional)"
                    value={data.npwpSupplier}
                    onChange={(e) => onChange({ npwpSupplier: e.target.value })}
                    className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kapasitasProduksiPenyuling" className="text-emerald-900 font-semibold">{t.form?.kapasitasProduksi || 'Kapasitas'}</Label>
                <Input 
                  id="kapasitasProduksiPenyuling" 
                  type="number"
                  placeholder="Contoh: 100"
                  value={data.kapasitasProduksi}
                  onChange={(e) => onChange({ kapasitasProduksi: e.target.value })}
                  className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                  required 
                />
              </div>
            </>
          )}

          {/* ── Section: Kapasitas & Grade (KOPERASI) ─────────── */}
          {data.supplierSubtype === 'KOPERASI' && (
            <div className="space-y-2">
              <Label htmlFor="kapasitasProduksiKoperasi" className="text-emerald-900 font-semibold">{t.form?.kapasitasProduksi || 'Kapasitas'}</Label>
              <Input 
                id="kapasitasProduksiKoperasi" 
                type="number"
                placeholder="Contoh: 500"
                value={data.kapasitasProduksi}
                onChange={(e) => onChange({ kapasitasProduksi: e.target.value })}
                className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                required 
              />
            </div>
          )}

          {/* ── Section: Grade Nilam (PENYULING & KOPERASI) ───── */}
          {(data.supplierSubtype === 'PENYULING' || data.supplierSubtype === 'KOPERASI') && (
            <div className="space-y-2">
              <Label className="text-emerald-900 font-semibold block">{t.form?.gradeNilam || 'Grade Nilam'}</Label>
              <div className="flex gap-4">
                {['GRADE_A', 'GRADE_B', 'GRADE_C'].map((g) => (
                  <label key={g} className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={data.gradeNilam?.includes(g)}
                      onChange={() => handleGradeToggle(g)}
                      className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{g === 'GRADE_A' ? 'A (PA≥32%)' : g === 'GRADE_B' ? 'B (PA28-31%)' : 'C (PA<28%)'}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Section: Koperasi Pembina (PETANI & PENYULING) ── */}
          {(data.supplierSubtype === 'PETANI' || data.supplierSubtype === 'PENYULING') && koperasiList.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="koperasiPembina" className="text-emerald-900 font-semibold">{t.form?.koperasiPembina || 'Koperasi Pembina'}</Label>
              <div className="relative">
                <select
                  id="koperasiPembina"
                  value={data.koperasiPembinaId}
                  onChange={(e) => onChange({ koperasiPembinaId: e.target.value })}
                  className="w-full h-12 bg-white border border-zinc-200 rounded-lg px-3 pr-10 focus-visible:ring-emerald-500 font-medium text-sm text-zinc-800 appearance-none"
                >
                  <option value="">{t.form?.koperasiPembinaPlaceholder || 'Pilih Koperasi...'}</option>
                  {koperasiList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_koperasi} — {k.kabupaten}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
