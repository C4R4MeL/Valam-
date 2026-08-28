'use client'

import { useState, useEffect } from 'react'
import { Building, FileText, User, Phone, MapPin, Save, Landmark, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useLocale } from 'next-intl'

export default function SupplierSettingsPage() {
  const { toast } = useToast()
  const locale = useLocale() as 'id' | 'en'
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    namaKoperasi: '',
    nib: '',
    npwp: '',
    namaPic: '',
    ktpPic: '',
    whatsapp: '',
    alamatLengkap: '',
    kabupaten: '',
    kecamatan: '',
    desa: '',
    kapasitasProduksi: 0,
    nomorRekening: '',
    namaBank: '',
    namaRekening: '',
    gradeNilam: [] as string[]
  })

  const getHeaders = () => {
    const token = localStorage.getItem('valam_token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchProfile = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/suppliers/me`, {
        headers: getHeaders()
      })
      if (res.ok) {
        const result = await res.json()
        const data = result.data
        if (data) {
          setProfile({
            namaKoperasi: data.nama_koperasi || '',
            nib: data.nib || '',
            npwp: data.npwp || '',
            namaPic: data.nama_pic || '',
            ktpPic: data.ktp_pic || '',
            whatsapp: data.whatsapp || '',
            alamatLengkap: data.alamat_lengkap || '',
            kabupaten: data.kabupaten || '',
            kecamatan: data.kecamatan || '',
            desa: data.desa || '',
            kapasitasProduksi: Number(data.kapasitas_produksi) || 0,
            nomorRekening: data.nomor_rekening || '',
            namaBank: data.nama_bank || '',
            namaRekening: data.nama_rekening || '',
            gradeNilam: data.grade_nilam || []
          })
        }
      } else {
        toast({
          title: locale === 'id' ? 'Gagal' : 'Error',
          description: locale === 'id' ? 'Gagal memuat profil' : 'Failed to load profile',
          variant: 'destructive'
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/suppliers/me/profile`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(profile)
      })

      if (res.ok) {
        toast({
          title: locale === 'id' ? 'Berhasil' : 'Success',
          description: locale === 'id' ? 'Pengaturan profil koperasi berhasil disimpan' : 'Cooperative profile settings saved successfully'
        })
        fetchProfile()
      } else {
        const error = await res.json()
        toast({
          title: locale === 'id' ? 'Gagal' : 'Error',
          description: error.message || (locale === 'id' ? 'Gagal memperbarui profil' : 'Failed to update profile'),
          variant: 'destructive'
        })
      }
    } catch (err) {
      console.error(err)
      toast({
        title: locale === 'id' ? 'Error' : 'Error',
        description: locale === 'id' ? 'Terjadi kesalahan sistem' : 'System error occurred',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleGrade = (grade: string) => {
    const activeGrades = [...profile.gradeNilam]
    if (activeGrades.includes(grade)) {
      setProfile({...profile, gradeNilam: activeGrades.filter(g => g !== grade)})
    } else {
      setProfile({...profile, gradeNilam: [...activeGrades, grade]})
    }
  }

  if (loading) {
    return (
      <div className="w-full flex flex-col min-h-screen bg-zinc-55 pb-20 justify-center items-center">
        <span className="text-sm font-bold text-emerald-850">Loading profile settings...</span>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col min-h-screen bg-zinc-55 pb-20">
      <DashboardHeader 
        title={locale === 'id' ? 'Pengaturan Profil Koperasi' : 'Cooperative Profile Settings'} 
        subtitle={locale === 'id' 
          ? 'Perbarui detail data administrasi, wilayah produksi, dan rekening koperasi Anda.' 
          : 'Update your cooperative administrative details, production regions, and bank accounts.'
        }
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-200/80 shadow-xl shadow-emerald-900/5 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Koperasi Info */}
            <h3 className="text-lg font-bold text-emerald-950 border-b border-zinc-100 pb-3 font-serif">
              {locale === 'id' ? 'Informasi Administrasi Koperasi' : 'Cooperative Administrative Info'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="namaKoperasi" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Nama Koperasi' : 'Cooperative Name'}
                </Label>
                <div className="relative">
                  <Input 
                    id="namaKoperasi"
                    value={profile.namaKoperasi}
                    onChange={(e) => setProfile({...profile, namaKoperasi: e.target.value})}
                    placeholder="Koperasi Tani Nilam Mandiri"
                    className="h-11 pl-10 text-sm border-zinc-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <Building className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nib" className="text-zinc-700 text-xs font-bold">NIB</Label>
                <div className="relative">
                  <Input 
                    id="nib"
                    value={profile.nib}
                    onChange={(e) => setProfile({...profile, nib: e.target.value})}
                    placeholder="9120001234567"
                    className="h-11 pl-10 text-sm border-zinc-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <FileText className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="npwp" className="text-zinc-700 text-xs font-bold">NPWP Koperasi</Label>
                <div className="relative">
                  <Input 
                    id="npwp"
                    value={profile.npwp}
                    onChange={(e) => setProfile({...profile, npwp: e.target.value})}
                    placeholder="01.234.567.8-901.000"
                    className="h-11 pl-10 text-sm border-zinc-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <FileText className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kapasitasProduksi" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Kapasitas Produksi Bulanan (Kg)' : 'Monthly Production Capacity (Kg)'}
                </Label>
                <div className="relative">
                  <Input 
                    id="kapasitasProduksi"
                    type="number"
                    value={profile.kapasitasProduksi}
                    onChange={(e) => setProfile({...profile, kapasitasProduksi: parseFloat(e.target.value) || 0})}
                    placeholder="500"
                    className="h-11 pl-10 text-sm border-zinc-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <Layers className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                </div>
              </div>
            </div>

            {/* PIC Info */}
            <h3 className="text-lg font-bold text-emerald-950 border-b border-zinc-100 pb-3 pt-4 font-serif">
              {locale === 'id' ? 'Penanggung Jawab Koperasi (PIC)' : 'Cooperative Person In Charge (PIC)'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="namaPic" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Nama Lengkap PIC' : 'PIC Full Name'}
                </Label>
                <div className="relative">
                  <Input 
                    id="namaPic"
                    value={profile.namaPic}
                    onChange={(e) => setProfile({...profile, namaPic: e.target.value})}
                    placeholder="Budi Santoso"
                    className="h-11 pl-10 text-sm border-zinc-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ktpPic" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Nomor KTP PIC' : 'PIC Identity Number (NIK)'}
                </Label>
                <div className="relative">
                  <Input 
                    id="ktpPic"
                    value={profile.ktpPic}
                    onChange={(e) => setProfile({...profile, ktpPic: e.target.value})}
                    placeholder="1101011234567890"
                    className="h-11 pl-10 text-sm border-zinc-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <FileText className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                </div>
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="whatsapp" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'No. WhatsApp Aktif' : 'Active WhatsApp Number'}
                </Label>
                <div className="relative">
                  <Input 
                    id="whatsapp"
                    value={profile.whatsapp}
                    onChange={(e) => setProfile({...profile, whatsapp: e.target.value})}
                    placeholder="081234567890"
                    className="h-11 pl-10 text-sm border-zinc-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <Phone className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                </div>
              </div>
            </div>

            {/* Wilayah / Alamat */}
            <h3 className="text-lg font-bold text-emerald-950 border-b border-zinc-100 pb-3 pt-4 font-serif">
              {locale === 'id' ? 'Wilayah Operasional & Alamat' : 'Operational Region & Address'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="kabupaten" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Kabupaten' : 'Regency'}
                </Label>
                <Input 
                  id="kabupaten"
                  value={profile.kabupaten}
                  onChange={(e) => setProfile({...profile, kabupaten: e.target.value})}
                  placeholder="Aceh Jaya"
                  className="h-11 text-sm border-zinc-200 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kecamatan" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Kecamatan' : 'District'}
                </Label>
                <Input 
                  id="kecamatan"
                  value={profile.kecamatan}
                  onChange={(e) => setProfile({...profile, kecamatan: e.target.value})}
                  placeholder="Krueng Sabee"
                  className="h-11 text-sm border-zinc-200 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desa" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Desa' : 'Village'}
                </Label>
                <Input 
                  id="desa"
                  value={profile.desa}
                  onChange={(e) => setProfile({...profile, desa: e.target.value})}
                  placeholder="Panga"
                  className="h-11 text-sm border-zinc-200 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamatLengkap" className="text-zinc-700 text-xs font-bold">
                {locale === 'id' ? 'Alamat Lengkap Koperasi' : 'Cooperative Complete Address'}
              </Label>
              <div className="relative">
                <Textarea 
                  id="alamatLengkap"
                  value={profile.alamatLengkap}
                  onChange={(e) => setProfile({...profile, alamatLengkap: e.target.value})}
                  placeholder="Jl. Raya Krueng Sabee Km. 4"
                  className="pl-10 text-sm border-zinc-200 rounded-xl min-h-[80px]"
                />
                <MapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
              </div>
            </div>

            {/* Bank Info */}
            <h3 className="text-lg font-bold text-emerald-950 border-b border-zinc-100 pb-3 pt-4 font-serif">
              {locale === 'id' ? 'Detail Rekening Bank (Pembayaran)' : 'Bank Account Details (Payout)'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="namaBank" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Nama Bank' : 'Bank Name'}
                </Label>
                <div className="relative">
                  <Input 
                    id="namaBank"
                    value={profile.namaBank}
                    onChange={(e) => setProfile({...profile, namaBank: e.target.value})}
                    placeholder="Bank Syariah Indonesia (BSI)"
                    className="h-11 pl-10 text-sm border-zinc-200 rounded-xl"
                  />
                  <Landmark className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomorRekening" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Nomor Rekening' : 'Account Number'}
                </Label>
                <Input 
                  id="nomorRekening"
                  value={profile.nomorRekening}
                  onChange={(e) => setProfile({...profile, nomorRekening: e.target.value})}
                  placeholder="7123456789"
                  className="h-11 text-sm border-zinc-200 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="namaRekening" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Nama Pemilik Rekening' : 'Beneficiary Name'}
                </Label>
                <Input 
                  id="namaRekening"
                  value={profile.namaRekening}
                  onChange={(e) => setProfile({...profile, namaRekening: e.target.value})}
                  placeholder="Koperasi Tani Nilam Mandiri"
                  className="h-11 text-sm border-zinc-200 rounded-xl"
                />
              </div>
            </div>

            {/* Grade Nilam */}
            <div className="space-y-3 pt-4 border-t border-zinc-100">
              <Label className="text-zinc-700 text-xs font-bold block">
                {locale === 'id' ? 'Kategori Grade Nilam yang Dapat Dipasok' : 'Supplied Patchouli Oil Grades'}
              </Label>
              <div className="flex gap-4">
                {['GRADE_A', 'GRADE_B', 'GRADE_C'].map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => toggleGrade(grade)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      profile.gradeNilam.includes(grade)
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                        : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    {grade.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex justify-end">
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-gold-500 hover:bg-gold-600 text-emerald-950 font-bold shadow-md h-12 px-6 rounded-xl text-sm flex items-center gap-2 hover:scale-[1.01] transition-transform duration-300"
              >
                {saving ? (locale === 'id' ? 'Menyimpan...' : 'Saving...') : (locale === 'id' ? 'Simpan Perubahan' : 'Save Changes')}
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
