'use client'

import { AuthSkeleton } from '@/components/skeletons'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/routing'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useToast } from '@/hooks/use-toast'
import { Leaf, ArrowRight, ArrowLeft, Factory, ShoppingCart, Eye, EyeOff, Sprout, FlaskConical, Building2, ChevronDown } from 'lucide-react'
import { useLocale } from 'next-intl'

// ── Sub-type definitions ─────────────────────────────────────────
type SupplierSubtype = 'PETANI' | 'PENYULING' | 'KOPERASI'

const subtypeConfig = {
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

const contentMap = {
  id: {
    hero: {
      badge: "Join the Ecosystem",
      title1: "Tingkatkan rantai pasok Anda dengan ",
      titleStrong: "transparansi absolut.",
      descSupplier: "Daftar sebagai Supplier untuk mendigitalkan inventori Anda dan menjangkau buyer global.",
      descBuyer: "Daftar sebagai Buyer untuk mendapatkan akses ke suplai nilam terverifikasi dengan PA > 30%."
    },
    form: {
      title: "Buat Akun Baru",
      subtitle: "Pilih jenis akun yang sesuai dengan peran bisnis Anda.",
      roleBuyer: "Buyer (Pembeli)",
      roleSupplier: "Supplier (Pemasok)",
      subtypeTitle: "Pilih Jenis Supplier",
      subtypeSubtitle: "Pilih peran yang paling sesuai dengan aktivitas Anda di rantai pasok nilam.",
      companyLabel: "Nama Perusahaan",
      companyPlaceholderBuyer: "PT. Global Fragrance",
      countryLabel: "Negara Domisili",
      countryIndonesia: "Indonesia (Lokal)",
      countryInternational: "Internasional (Luar Negeri)",
      emailLabel: "Email Resmi",
      emailPlaceholder: "nama@perusahaan.com",
      pwdLabel: "Kata Sandi",
      pwdPlaceholder: "••••••••",
      pwdHint: "Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.",
      btnSubmitPrefix: "Daftar sebagai",
      btnLoading: "Mendaftarkan...",
      hasAccount: "Sudah terdaftar di ekosistem Valam?",
      login: "Masuk di sini",
      // Field labels
      namaLengkap: "Nama Lengkap (Sesuai KTP)",
      nikKtp: "NIK KTP (16 Digit)",
      nikKtpPic: "NIK KTP PIC",
      whatsapp: "No WhatsApp",
      desa: "Desa/Gampong",
      kecamatan: "Kecamatan",
      kabupaten: "Kabupaten",
      luasLahan: "Estimasi Luas Lahan (Ha)",
      estimasiPanen: "Estimasi Panen (kg/bln, daun basah)",
      punyaAlatSuling: "Apakah punya alat suling sendiri?",
      kapasitasProduksi: "Kapasitas Produksi Minyak (Kg/Bulan)",
      gradeNilam: "Mampu Pasok Grade Nilam:",
      koperasiPembina: "Koperasi Pembina (Opsional)",
      koperasiPembinaPlaceholder: "Pilih koperasi...",
      namaKoperasi: "Nama Koperasi (Sesuai Akta Resmi)",
      nibKoperasi: "NIB Koperasi (OSS)",
      npwpKoperasi: "NPWP Koperasi",
      namaKetuaPic: "Nama Ketua / PIC",
      alamatLengkap: "Alamat Lengkap",
      nibOptional: "NIB / NPWP (Opsional)",
      npwpOptional: "NPWP (Opsional)",
    },
    toast: {
      success: "Pendaftaran Berhasil",
      successDesc: "Selamat! Akun Anda telah dibuat. Silakan login.",
      mock: "Pendaftaran Prototype Berhasil (Offline Mode)",
      mockDesc: "Akun dibuat secara simulasi sebagai"
    },
    validation: {
      nikLength: "NIK harus tepat 16 digit angka",
    }
  },
  en: {
    hero: {
      badge: "Join the Ecosystem",
      title1: "Elevate your supply chain with ",
      titleStrong: "absolute transparency.",
      descSupplier: "Register as a Supplier to digitize your inventory and reach global buyers.",
      descBuyer: "Register as a Buyer to gain access to verified patchouli supply with PA > 30%."
    },
    form: {
      title: "Create New Account",
      subtitle: "Choose the account type that fits your business role.",
      roleBuyer: "Buyer",
      roleSupplier: "Supplier",
      subtypeTitle: "Choose Supplier Type",
      subtypeSubtitle: "Select the role that best matches your activity in the patchouli supply chain.",
      companyLabel: "Company Name",
      companyPlaceholderBuyer: "Global Fragrance Inc.",
      countryLabel: "Country of Domicile",
      countryIndonesia: "Indonesia (Domestic)",
      countryInternational: "International (Export)",
      emailLabel: "Official Email",
      emailPlaceholder: "name@company.com",
      pwdLabel: "Password",
      pwdPlaceholder: "••••••••",
      pwdHint: "Use at least 8 characters with a mix of letters and numbers.",
      btnSubmitPrefix: "Register as",
      btnLoading: "Registering...",
      hasAccount: "Already registered in Valam ecosystem?",
      login: "Log in here",
      namaLengkap: "Full Name (as on ID Card)",
      nikKtp: "NIK ID Card (16 Digits)",
      nikKtpPic: "NIK ID Card PIC",
      whatsapp: "WhatsApp Number",
      desa: "Village/Gampong",
      kecamatan: "Sub-district",
      kabupaten: "District",
      luasLahan: "Estimated Land Area (Ha)",
      estimasiPanen: "Estimated Harvest (kg/month, wet leaves)",
      punyaAlatSuling: "Do you have your own distillation equipment?",
      kapasitasProduksi: "Oil Production Capacity (Kg/Month)",
      gradeNilam: "Patchouli Grade Supply:",
      koperasiPembina: "Parent Cooperative (Optional)",
      koperasiPembinaPlaceholder: "Select cooperative...",
      namaKoperasi: "Cooperative Name (as on Official Deed)",
      nibKoperasi: "Cooperative NIB (OSS)",
      npwpKoperasi: "Cooperative NPWP",
      namaKetuaPic: "Chairman / PIC Name",
      alamatLengkap: "Full Address",
      nibOptional: "NIB / NPWP (Optional)",
      npwpOptional: "NPWP (Optional)",
    },
    toast: {
      success: "Registration Successful",
      successDesc: "Congratulations! Your account has been created. Please log in.",
      mock: "Prototype Registration Successful (Offline Mode)",
      mockDesc: "Simulated account created as"
    },
    validation: {
      nikLength: "NIK must be exactly 16 numeric digits",
    }
  }
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') === 'supplier' ? 'supplier' : 'buyer'
  
  const [role, setRole] = useState<'buyer' | 'supplier'>(defaultRole)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [country, setCountry] = useState('ID')
  const [npwpBuyer, setNpwpBuyer] = useState('')

  // ── Supplier Sub-type ────────────────────────────────────────────
  const [supplierSubtype, setSupplierSubtype] = useState<SupplierSubtype | null>(null)

  // ── Shared Supplier Fields ───────────────────────────────────────
  const [namaPic, setNamaPic] = useState('')
  const [ktpPic, setKtpPic] = useState('')
  const [ktpError, setKtpError] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [kabupaten, setKabupaten] = useState('')
  const [kecamatan, setKecamatan] = useState('')
  const [desa, setDesa] = useState('')

  // ── Koperasi-specific ────────────────────────────────────────────
  const [namaKoperasi, setNamaKoperasi] = useState('')
  const [nib, setNib] = useState('')
  const [npwpSupplier, setNpwpSupplier] = useState('')
  const [alamatLengkap, setAlamatLengkap] = useState('')

  // ── Capacity & Grade ─────────────────────────────────────────────
  const [kapasitasProduksi, setKapasitasProduksi] = useState('')
  const [gradeNilam, setGradeNilam] = useState<string[]>(['GRADE_A'])

  // ── Petani-specific ──────────────────────────────────────────────
  const [luasLahan, setLuasLahan] = useState('')
  const [estimasiPanen, setEstimasiPanen] = useState('')
  const [punyaAlatSuling, setPunyaAlatSuling] = useState(false)

  // ── Koperasi Pembina (for Petani/Penyuling) ──────────────────────
  const [koperasiPembinaId, setKoperasiPembinaId] = useState('')
  const [koperasiList, setKoperasiList] = useState<Array<{ id: string; nama_koperasi: string; kabupaten: string }>>([])
  
  const router = useRouter()
  const { toast } = useToast()
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id

  // ── Fetch Koperasi Pembina list ──────────────────────────────────
  useEffect(() => {
    if (role === 'supplier' && (supplierSubtype === 'PETANI' || supplierSubtype === 'PENYULING')) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
      fetch(`${apiUrl}/suppliers/koperasi-pembina`)
        .then(res => res.ok ? res.json() : { data: [] })
        .then(json => setKoperasiList(json.data || []))
        .catch(() => setKoperasiList([]))
    }
  }, [role, supplierSubtype])

  // ── NIK Validation ───────────────────────────────────────────────
  const validateKtp = (value: string) => {
    setKtpPic(value)
    if (value && !/^\d{16}$/.test(value)) {
      setKtpError(t.validation.nikLength)
    } else {
      setKtpError('')
    }
  }

  const handleGradeToggle = (grade: string) => {
    setGradeNilam(prev => 
      prev.includes(grade) 
        ? prev.filter(g => g !== grade)
        : [...prev, grade]
    )
  }

  // ── Get display label for subtype ────────────────────────────────
  const getSubtypeLabel = (subtype: SupplierSubtype | null) => {
    if (!subtype) return 'Supplier'
    const config = subtypeConfig[subtype]
    return locale === 'en' ? config.labelEn.split(' (')[0] : config.labelId.split(' (')[0]
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate NIK before submit
    if (role === 'supplier' && ktpPic && !/^\d{16}$/.test(ktpPic)) {
      toast({ title: "Validasi Gagal", description: t.validation.nikLength, variant: "destructive" })
      return
    }

    setLoading(true)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'

    try {
      // Step 1: Register User Account
      const regRes = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          roleName: role,
          companyName: role === 'supplier' 
            ? (supplierSubtype === 'KOPERASI' ? namaKoperasi : namaPic) 
            : companyName,
          fullName: role === 'supplier' ? namaPic : 'User ' + companyName,
          country: 'ID',
          npwp: role === 'buyer' && country === 'ID' ? npwpBuyer : undefined,
        }),
      });

      if (!regRes.ok) {
        const errorData = await regRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal mendaftarkan akun pengguna.');
      }

      // Step 2: Login immediately to get token for supplier profile creation
      if (role === 'supplier' && supplierSubtype) {
        const loginRes = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!loginRes.ok) {
          throw new Error('Akun berhasil dibuat, namun gagal login otomatis. Silakan masuk secara manual.');
        }

        const loginData = await loginRes.json();
        const token = loginData.access_token;

        // Step 3: Register Supplier Profile with sub-type
        const supplierPayload: Record<string, unknown> = {
          supplierSubtype,
          namaPic,
          ktpPic,
          whatsapp,
          kabupaten,
          kecamatan,
          desa,
        }

        // Add sub-type-specific fields
        if (supplierSubtype === 'KOPERASI') {
          supplierPayload.namaKoperasi = namaKoperasi
          supplierPayload.nib = nib
          supplierPayload.npwp = npwpSupplier
          supplierPayload.alamatLengkap = alamatLengkap
          supplierPayload.kapasitasProduksi = parseFloat(kapasitasProduksi) || 0
          supplierPayload.gradeNilam = gradeNilam
        } else if (supplierSubtype === 'PENYULING') {
          supplierPayload.kapasitasProduksi = parseFloat(kapasitasProduksi) || 0
          supplierPayload.gradeNilam = gradeNilam
          if (nib) supplierPayload.nib = nib
          if (npwpSupplier) supplierPayload.npwp = npwpSupplier
          if (koperasiPembinaId) supplierPayload.koperasiPembinaId = koperasiPembinaId
        } else if (supplierSubtype === 'PETANI') {
          supplierPayload.luasLahan = parseFloat(luasLahan) || 0
          supplierPayload.estimasiPanen = parseFloat(estimasiPanen) || 0
          supplierPayload.punyaAlatSuling = punyaAlatSuling
          if (punyaAlatSuling) {
            supplierPayload.kapasitasProduksi = parseFloat(kapasitasProduksi) || 0
            supplierPayload.gradeNilam = gradeNilam
          }
          if (koperasiPembinaId) supplierPayload.koperasiPembinaId = koperasiPembinaId
        }

        const supProfileRes = await fetch(`${apiUrl}/suppliers/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(supplierPayload)
        });

        if (!supProfileRes.ok) {
          const supError = await supProfileRes.json().catch(() => ({}));
          throw new Error(supError.message || 'Profil supplier gagal disimpan. Lengkapi di dashboard.');
        }
      }

      toast({
        title: t.toast.success,
        description: t.toast.successDesc,
        variant: "default"
      });

      router.push(`/${locale}/login`);
    } catch (error: any) {
      toast({
        title: "Pendaftaran Gagal",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false)
    }
  }

  // ── Check if supplier form is ready (subtype selected) ───────────
  const showSupplierForm = role === 'supplier' && supplierSubtype !== null

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex w-full bg-zinc-50">
      
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-emerald-950 flex-col justify-between overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/smart_farm.png" 
            alt="Valam Supplier Network" 
            fill 
            className="object-cover opacity-40 mix-blend-overlay"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/80 to-transparent" />
        </div>

        {/* Top Logo */}
        <div className="relative z-10 p-12">
          <Link className="flex items-center gap-3 group w-fit" href="/">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
              <Leaf className="w-5 h-5 text-emerald-950" />
            </div>
            <span className="font-serif font-bold text-2xl tracking-tight text-white">
              Valam<span className="text-gold-400">.</span>
            </span>
          </Link>
        </div>

        {/* Bottom Copy */}
        <div className="relative z-10 p-12 max-w-lg">
          <div className="space-y-6">
            <span className="inline-block px-3 py-1 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-xs font-semibold tracking-widest uppercase">
              {t.hero.badge}
            </span>
            <h1 className="text-4xl font-serif text-white font-medium leading-tight">
              {t.hero.title1}<span className="italic text-gold-300">{t.hero.titleStrong}</span>
            </h1>
            <p className="text-emerald-100/70 text-lg">
              {role === 'supplier' ? t.hero.descSupplier : t.hero.descBuyer}
            </p>
          </div>
          
          <div className="mt-12 flex items-center gap-4 text-emerald-100/50 text-sm">
            <span>© 2026 Valam Ecosystem</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form (Scrollable) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:h-full lg:overflow-y-auto">
        <div className="w-full max-w-md space-y-8 py-8 my-auto">
          {/* Back to Home Link */}
          <div className="flex justify-start">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {locale === 'en' ? 'Back to Home' : 'Kembali ke Beranda'}
            </Link>
          </div>
          
          {/* Mobile Logo (Only visible on small screens) */}
          <div className="lg:hidden flex justify-center mb-4">
            <Link className="flex items-center gap-2 group" href="/">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-serif font-bold text-2xl tracking-tight text-emerald-955">
                Valam<span className="text-gold-500">.</span>
              </span>
            </Link>
          </div>

          <div className="space-y-3 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-emerald-950">{t.form.title}</h2>
            <p className="text-muted-foreground">{t.form.subtitle}</p>
          </div>
          
          {/* Role Switcher (Buyer / Supplier) */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-zinc-100 rounded-xl border border-zinc-200">
            <button 
              className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-lg transition-all duration-300 ${role === 'buyer' ? 'bg-white shadow-sm border border-zinc-200 text-emerald-900' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'}`}
              onClick={() => { setRole('buyer'); setSupplierSubtype(null) }}
              type="button"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="text-sm font-semibold">{t.form.roleBuyer}</span>
            </button>
            <button 
              className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-lg transition-all duration-300 ${role === 'supplier' ? 'bg-white shadow-sm border border-zinc-200 text-emerald-900' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'}`}
              onClick={() => setRole('supplier')}
              type="button"
            >
              <Factory className="w-5 h-5" />
              <span className="text-sm font-semibold">{t.form.roleSupplier}</span>
            </button>
          </div>

          {/* ── SUPPLIER SUB-TYPE SELECTOR ─────────────────────────── */}
          {role === 'supplier' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-emerald-900 font-semibold text-sm">{t.form.subtypeTitle}</Label>
                <p className="text-xs text-muted-foreground">{t.form.subtypeSubtitle}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(subtypeConfig) as SupplierSubtype[]).map((key) => {
                  const config = subtypeConfig[key]
                  const Icon = config.icon
                  const isSelected = supplierSubtype === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSupplierSubtype(key)}
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
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* ── SUPPLIER FORM (Dynamic per sub-type) ─────────────── */}
            {showSupplierForm && (
              <>
                {/* ── Section: Koperasi Identity (only KOPERASI) ───── */}
                {supplierSubtype === 'KOPERASI' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="namaKoperasi" className="text-emerald-900 font-semibold">{t.form.namaKoperasi}</Label>
                      <Input 
                        id="namaKoperasi" 
                        placeholder="Koperasi Tani Nilam Jaya"
                        value={namaKoperasi}
                        onChange={(e) => setNamaKoperasi(e.target.value)}
                        className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nib" className="text-emerald-900 font-semibold">{t.form.nibKoperasi}</Label>
                        <Input 
                          id="nib" 
                          placeholder="NIB Koperasi"
                          value={nib}
                          onChange={(e) => setNib(e.target.value)}
                          className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="npwpSupplier" className="text-emerald-900 font-semibold">{t.form.npwpKoperasi}</Label>
                        <Input 
                          id="npwpSupplier" 
                          placeholder="NPWP Koperasi"
                          value={npwpSupplier}
                          onChange={(e) => setNpwpSupplier(e.target.value)}
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
                      {supplierSubtype === 'KOPERASI' ? t.form.namaKetuaPic : t.form.namaLengkap}
                    </Label>
                    <Input 
                      id="namaPic" 
                      placeholder={supplierSubtype === 'KOPERASI' ? 'Nama Pengurus' : 'Nama sesuai KTP'}
                      value={namaPic}
                      onChange={(e) => setNamaPic(e.target.value)}
                      className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ktpPic" className="text-emerald-900 font-semibold">
                      {supplierSubtype === 'KOPERASI' ? t.form.nikKtpPic : t.form.nikKtp}
                    </Label>
                    <Input 
                      id="ktpPic" 
                      placeholder="16 digit angka"
                      value={ktpPic}
                      onChange={(e) => validateKtp(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      maxLength={16}
                      className={`h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500 ${ktpError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                      required 
                    />
                    {ktpError && (
                      <p className="text-xs text-red-500 mt-1">{ktpError}</p>
                    )}
                  </div>
                </div>

                {/* ── Section: WhatsApp ──────────────────────────────── */}
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-emerald-900 font-semibold">{t.form.whatsapp}</Label>
                  <Input 
                    id="whatsapp" 
                    placeholder="Contoh: 08123456789"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                    required 
                  />
                </div>

                {/* ── Section: Lokasi (All sub-types) ───────────────── */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="desa" className="text-emerald-900 font-semibold">{t.form.desa}</Label>
                    <Input 
                      id="desa" 
                      placeholder="Desa"
                      value={desa}
                      onChange={(e) => setDesa(e.target.value)}
                      className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kecamatan" className="text-emerald-900 font-semibold">{t.form.kecamatan}</Label>
                    <Input 
                      id="kecamatan" 
                      placeholder="Kecamatan"
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                      className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kabupaten" className="text-emerald-900 font-semibold">{t.form.kabupaten}</Label>
                    <Input 
                      id="kabupaten" 
                      placeholder="Kabupaten"
                      value={kabupaten}
                      onChange={(e) => setKabupaten(e.target.value)}
                      className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                      required 
                    />
                  </div>
                </div>

                {/* ── Section: Alamat Lengkap (KOPERASI only) ────────── */}
                {supplierSubtype === 'KOPERASI' && (
                  <div className="space-y-2">
                    <Label htmlFor="alamatLengkap" className="text-emerald-900 font-semibold">{t.form.alamatLengkap}</Label>
                    <Input 
                      id="alamatLengkap" 
                      placeholder="Nama Jalan, RT/RW, Dusun"
                      value={alamatLengkap}
                      onChange={(e) => setAlamatLengkap(e.target.value)}
                      className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                      required 
                    />
                  </div>
                )}

                {/* ── Section: Petani-specific fields ───────────────── */}
                {supplierSubtype === 'PETANI' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="luasLahan" className="text-emerald-900 font-semibold">{t.form.luasLahan}</Label>
                        <Input 
                          id="luasLahan" 
                          type="number"
                          step="0.1"
                          placeholder="Contoh: 2.5"
                          value={luasLahan}
                          onChange={(e) => setLuasLahan(e.target.value)}
                          className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estimasiPanen" className="text-emerald-900 font-semibold">{t.form.estimasiPanen}</Label>
                        <Input 
                          id="estimasiPanen" 
                          type="number"
                          placeholder="Contoh: 500"
                          value={estimasiPanen}
                          onChange={(e) => setEstimasiPanen(e.target.value)}
                          className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                          required 
                        />
                      </div>
                    </div>

                    {/* ── Toggle: Punya Alat Suling ────────────────── */}
                    <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/50 space-y-3">
                      <label className="flex items-center justify-between cursor-pointer select-none">
                        <span className="text-sm font-semibold text-emerald-900">{t.form.punyaAlatSuling}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={punyaAlatSuling}
                          onClick={() => setPunyaAlatSuling(!punyaAlatSuling)}
                          className={`
                            relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                            transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                            ${punyaAlatSuling ? 'bg-emerald-600' : 'bg-zinc-300'}
                          `}
                        >
                          <span className={`
                            pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 
                            transition-transform duration-300 ease-in-out
                            ${punyaAlatSuling ? 'translate-x-5' : 'translate-x-0'}
                          `} />
                        </button>
                      </label>

                      {/* ── Conditional Penyuling fields (reactive) ─── */}
                      <div className={`
                        space-y-4 overflow-hidden transition-all duration-500 ease-in-out
                        ${punyaAlatSuling ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'}
                      `}>
                        <div className="space-y-2">
                          <Label htmlFor="kapasitasProduksiPetani" className="text-emerald-900 font-semibold">{t.form.kapasitasProduksi}</Label>
                          <Input 
                            id="kapasitasProduksiPetani" 
                            type="number"
                            placeholder="Contoh: 50"
                            value={kapasitasProduksi}
                            onChange={(e) => setKapasitasProduksi(e.target.value)}
                            className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                            required={punyaAlatSuling}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-emerald-900 font-semibold block">{t.form.gradeNilam}</Label>
                          <div className="flex gap-4">
                            {['GRADE_A', 'GRADE_B', 'GRADE_C'].map((g) => (
                              <label key={g} className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer select-none">
                                <input 
                                  type="checkbox"
                                  checked={gradeNilam.includes(g)}
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
                {supplierSubtype === 'PENYULING' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nibPenyuling" className="text-emerald-900 font-semibold">{t.form.nibOptional}</Label>
                        <Input 
                          id="nibPenyuling" 
                          placeholder="NIB (opsional)"
                          value={nib}
                          onChange={(e) => setNib(e.target.value)}
                          className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="npwpPenyuling" className="text-emerald-900 font-semibold">{t.form.npwpOptional}</Label>
                        <Input 
                          id="npwpPenyuling" 
                          placeholder="NPWP (opsional)"
                          value={npwpSupplier}
                          onChange={(e) => setNpwpSupplier(e.target.value)}
                          className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kapasitasProduksiPenyuling" className="text-emerald-900 font-semibold">{t.form.kapasitasProduksi}</Label>
                      <Input 
                        id="kapasitasProduksiPenyuling" 
                        type="number"
                        placeholder="Contoh: 100"
                        value={kapasitasProduksi}
                        onChange={(e) => setKapasitasProduksi(e.target.value)}
                        className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                        required 
                      />
                    </div>
                  </>
                )}

                {/* ── Section: Kapasitas & Grade (KOPERASI) ─────────── */}
                {supplierSubtype === 'KOPERASI' && (
                  <div className="space-y-2">
                    <Label htmlFor="kapasitasProduksiKoperasi" className="text-emerald-900 font-semibold">{t.form.kapasitasProduksi}</Label>
                    <Input 
                      id="kapasitasProduksiKoperasi" 
                      type="number"
                      placeholder="Contoh: 500"
                      value={kapasitasProduksi}
                      onChange={(e) => setKapasitasProduksi(e.target.value)}
                      className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                      required 
                    />
                  </div>
                )}

                {/* ── Section: Grade Nilam (PENYULING & KOPERASI) ───── */}
                {(supplierSubtype === 'PENYULING' || supplierSubtype === 'KOPERASI') && (
                  <div className="space-y-2">
                    <Label className="text-emerald-900 font-semibold block">{t.form.gradeNilam}</Label>
                    <div className="flex gap-4">
                      {['GRADE_A', 'GRADE_B', 'GRADE_C'].map((g) => (
                        <label key={g} className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={gradeNilam.includes(g)}
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
                {(supplierSubtype === 'PETANI' || supplierSubtype === 'PENYULING') && koperasiList.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="koperasiPembina" className="text-emerald-900 font-semibold">{t.form.koperasiPembina}</Label>
                    <div className="relative">
                      <select
                        id="koperasiPembina"
                        value={koperasiPembinaId}
                        onChange={(e) => setKoperasiPembinaId(e.target.value)}
                        className="w-full h-12 bg-white border border-zinc-200 rounded-lg px-3 pr-10 focus-visible:ring-emerald-500 font-medium text-sm text-zinc-800 appearance-none"
                      >
                        <option value="">{t.form.koperasiPembinaPlaceholder}</option>
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
              </>
            )}

            {/* ── BUYER FIELDS ─────────────────────────────────────── */}
            {role === 'buyer' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-emerald-900 font-semibold">
                    {t.form.companyLabel}
                  </Label>
                  <Input 
                    id="companyName" 
                    placeholder={t.form.companyPlaceholderBuyer} 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-emerald-900 font-semibold">
                    {t.form.countryLabel}
                  </Label>
                  <select 
                    id="country" 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-12 bg-white border border-zinc-200 rounded-lg px-3 focus-visible:ring-emerald-500 font-medium text-sm text-zinc-800"
                    required
                  >
                    <option value="ID">{t.form.countryIndonesia}</option>
                    <option value="SG">Singapore (SG)</option>
                    <option value="US">United States (US)</option>
                    <option value="FR">France (FR)</option>
                    <option value="DE">Germany (DE)</option>
                  </select>
                </div>

                {country === 'ID' && (
                  <div className="space-y-2">
                    <Label htmlFor="npwpBuyer" className="text-emerald-900 font-semibold">
                      NPWP (Nomor Pokok Wajib Pajak)
                    </Label>
                    <Input 
                      id="npwpBuyer" 
                      placeholder="00.000.000.0-000.000" 
                      value={npwpBuyer}
                      onChange={(e) => setNpwpBuyer(e.target.value)}
                      className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500 font-medium text-zinc-800"
                      required 
                    />
                  </div>
                )}
              </>
            )}
            
            {/* Email & Password (Required for all roles) */}
            {(role === 'buyer' || showSupplierForm) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-emerald-900 font-semibold">{t.form.emailLabel}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder={t.form.emailPlaceholder} 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-emerald-900 font-semibold">{t.form.pwdLabel}</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t.form.pwdPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500 pr-10"
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    {t.form.pwdHint}
                  </p>
                </div>
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gold-500 hover:bg-gold-600 text-emerald-955 font-bold rounded-xl shadow-lg shadow-gold-500/20 transition-all group border-none" 
                    disabled={loading || (role === 'supplier' && !supplierSubtype)}
                  >
                    {loading ? (
                      t.form.btnLoading
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {t.form.btnSubmitPrefix} {role === 'supplier' ? getSubtypeLabel(supplierSubtype) : 'Buyer'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
          
          <div className="text-center text-xs text-zinc-500">
            {t.form.hasAccount}{" "}
            <Link href="/login" className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline transition-colors">
              {t.form.login}
            </Link>
          </div>

        </div>
      </div>
      
    </div>
  )
}
