'use client'

import { useState, useEffect } from 'react'
import { Building, FileText, User, Phone, MapPin, Globe, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { useLocale } from 'next-intl'

export default function BuyerSettingsPage() {
  const { toast } = useToast()
  const locale = useLocale() as 'id' | 'en'
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    company_name: '',
    legal_number: '',
    npwp: '',
    chairman_name: '',
    country: '',
    contact_person: '',
    phone: '',
    address: ''
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
      const res = await fetch(`${apiUrl}/profiles/me`, {
        headers: getHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setProfile({
          company_name: data.company_name || '',
          legal_number: data.legal_number || '',
          npwp: data.npwp || '',
          chairman_name: data.chairman_name || '',
          country: data.country || '',
          contact_person: data.contact_person || '',
          phone: data.phone || '',
          address: data.address || ''
        })
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
      const res = await fetch(`${apiUrl}/profiles/me`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(profile)
      })

      if (res.ok) {
        toast({
          title: locale === 'id' ? 'Berhasil' : 'Success',
          description: locale === 'id' ? 'Pengaturan profil berhasil disimpan' : 'Profile settings saved successfully'
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
        title={locale === 'id' ? 'Pengaturan Profil' : 'Profile Settings'} 
        subtitle={locale === 'id' 
          ? 'Perbarui detail profil akun perusahaan dan kontak informasi pengadaan Anda.' 
          : 'Update your company profile details and procurement contact information.'
        }
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-zinc-200/80 shadow-xl shadow-emerald-900/5 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-lg font-bold text-emerald-950 border-b border-zinc-100 pb-3 font-serif">
              {locale === 'id' ? 'Informasi Perusahaan' : 'Company Information'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Nama Perusahaan' : 'Company Name'}
                </Label>
                <div className="relative">
                  <Input 
                    id="company_name"
                    value={profile.company_name}
                    onChange={(e) => setProfile({...profile, company_name: e.target.value})}
                    placeholder={locale === 'id' ? 'PT Nilam Jaya' : 'PT Nilam Jaya Ltd'}
                    className="h-11 pl-10 text-sm border-zinc-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <Building className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="legal_number" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Nomor Legal / NIB' : 'Legal Number / NIB'}
                </Label>
                <div className="relative">
                  <Input 
                    id="legal_number"
                    value={profile.legal_number}
                    onChange={(e) => setProfile({...profile, legal_number: e.target.value})}
                    placeholder="9120001234567"
                    className="h-11 pl-10 text-sm border-zinc-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <FileText className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="npwp" className="text-zinc-700 text-xs font-bold">NPWP</Label>
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
                <Label htmlFor="chairman_name" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Nama Direktur / Pemilik' : 'Director / Owner'}
                </Label>
                <div className="relative">
                  <Input 
                    id="chairman_name"
                    value={profile.chairman_name}
                    onChange={(e) => setProfile({...profile, chairman_name: e.target.value})}
                    placeholder="Budi Santoso"
                    className="h-11 pl-10 text-sm border-zinc-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Negara' : 'Country'}
                </Label>
                <div className="relative">
                  <Input 
                    id="country"
                    value={profile.country}
                    onChange={(e) => setProfile({...profile, country: e.target.value})}
                    placeholder="Indonesia"
                    className="h-11 pl-10 text-sm border-zinc-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <Globe className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-emerald-950 border-b border-zinc-100 pb-3 pt-4 font-serif">
              {locale === 'id' ? 'Kontak Person' : 'Contact Person'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="contact_person" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'Nama Kontak' : 'Contact Name'}
                </Label>
                <div className="relative">
                  <Input 
                    id="contact_person"
                    value={profile.contact_person}
                    onChange={(e) => setProfile({...profile, contact_person: e.target.value})}
                    placeholder="Aditya Wijaya"
                    className="h-11 pl-10 text-sm border-zinc-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-zinc-700 text-xs font-bold">
                  {locale === 'id' ? 'No. Telepon / WhatsApp' : 'Phone / WhatsApp'}
                </Label>
                <div className="relative">
                  <Input 
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    placeholder="081234567890"
                    className="h-11 pl-10 text-sm border-zinc-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <Phone className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-zinc-700 text-xs font-bold">
                {locale === 'id' ? 'Alamat Kantor' : 'Office Address'}
              </Label>
              <div className="relative">
                <Textarea 
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({...profile, address: e.target.value})}
                  placeholder={locale === 'id' ? 'Jl. Sudirman No. 45, Jakarta Selatan' : 'Sudirman St No. 45, South Jakarta'}
                  className="pl-10 text-sm border-zinc-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px]"
                />
                <MapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
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
