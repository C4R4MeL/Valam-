'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/routing'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useToast } from '@/hooks/use-toast'
import { Leaf, ArrowRight, ArrowLeft, Factory, ShoppingCart, Eye, EyeOff } from 'lucide-react'
import { useLocale } from 'next-intl'

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
      roleSupplier: "Supplier (Koperasi)",
      companyLabel: "Nama Perusahaan / Koperasi",
      companyPlaceholderSupplier: "Koperasi Tani Nilam Jaya",
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
      login: "Masuk di sini"
    },
    toast: {
      success: "Pendaftaran Berhasil",
      successDesc: "Selamat! Akun Anda telah dibuat. Silakan login.",
      mock: "Pendaftaran Prototype Berhasil (Offline Mode)",
      mockDesc: "Akun dibuat secara simulasi sebagai"
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
      roleSupplier: "Supplier (Cooperative)",
      companyLabel: "Company / Cooperative Name",
      companyPlaceholderSupplier: "Patchouli Farmers Cooperative",
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
      login: "Log in here"
    },
    toast: {
      success: "Registration Successful",
      successDesc: "Congratulations! Your account has been created. Please log in.",
      mock: "Prototype Registration Successful (Offline Mode)",
      mockDesc: "Simulated account created as"
    }
  }
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50">Loading...</div>}>
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

  // Supplier Poin 1 Fields
  const [nib, setNib] = useState('')
  const [npwp, setNpwp] = useState('')
  const [namaPic, setNamaPic] = useState('')
  const [ktpPic, setKtpPic] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [alamatLengkap, setAlamatLengkap] = useState('')
  const [kabupaten, setKabupaten] = useState('')
  const [kecamatan, setKecamatan] = useState('')
  const [desa, setDesa] = useState('')
  const [kapasitasProduksi, setKapasitasProduksi] = useState('')
  const [gradeNilam, setGradeNilam] = useState<string[]>(['GRADE_A'])
  
  const router = useRouter()
  const { toast } = useToast()

  
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id

  const handleGradeToggle = (grade: string) => {
    setGradeNilam(prev => 
      prev.includes(grade) 
        ? prev.filter(g => g !== grade)
        : [...prev, grade]
    )
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
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
          companyName: companyName,
          fullName: role === 'supplier' ? namaPic : 'User ' + companyName,
          country,
          npwp: role === 'buyer' && country === 'ID' ? npwp : undefined,
        }),
      });

      if (!regRes.ok) {
        const errorData = await regRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal mendaftarkan akun pengguna.');
      }

      // Step 2: Login immediately to get token if we are registering a Supplier
      // so we can call /suppliers/register.
      if (role === 'supplier') {
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

        // Step 3: Register Supplier Profile
        const supProfileRes = await fetch(`${apiUrl}/suppliers/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            namaKoperasi: companyName,
            nib,
            npwp,
            namaPic,
            ktpPic,
            whatsapp,
            alamatLengkap,
            kabupaten,
            kecamatan,
            desa,
            kapasitasProduksi: parseFloat(kapasitasProduksi) || 0,
            gradeNilam,
          })
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
          
          {/* Role Switcher */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-zinc-100 rounded-xl border border-zinc-200">
            <button 
              className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-lg transition-all duration-300 ${role === 'buyer' ? 'bg-white shadow-sm border border-zinc-200 text-emerald-900' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'}`}
              onClick={() => setRole('buyer')}
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

          <form onSubmit={handleRegister} className="space-y-4">
            {/* 1. Nama Perusahaan / Koperasi */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-emerald-900 font-semibold">
                {role === 'supplier' ? 'Nama Koperasi (Sesuai Akta Resmi)' : t.form.companyLabel}
              </Label>
              <Input 
                id="companyName" 
                placeholder={role === 'supplier' ? t.form.companyPlaceholderSupplier : t.form.companyPlaceholderBuyer} 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                required 
              />
            </div>

            {/* ── SUPPLIER FIELDS (Poin 1) ────────────────────────────────── */}
            {role === 'supplier' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nib" className="text-emerald-900 font-semibold">NIB Koperasi (OSS)</Label>
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
                    <Label htmlFor="npwp" className="text-emerald-900 font-semibold">NPWP Koperasi</Label>
                    <Input 
                      id="npwp" 
                      placeholder="NPWP Koperasi"
                      value={npwp}
                      onChange={(e) => setNpwp(e.target.value)}
                      className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="namaPic" className="text-emerald-900 font-semibold">Nama Ketua / PIC</Label>
                    <Input 
                      id="namaPic" 
                      placeholder="Nama Pengurus"
                      value={namaPic}
                      onChange={(e) => setNamaPic(e.target.value)}
                      className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ktpPic" className="text-emerald-900 font-semibold">NIK KTP PIC</Label>
                    <Input 
                      id="ktpPic" 
                      placeholder="NIK 16 digit"
                      value={ktpPic}
                      onChange={(e) => setKtpPic(e.target.value)}
                      className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-emerald-900 font-semibold">No WhatsApp PIC</Label>
                    <Input 
                      id="whatsapp" 
                      placeholder="Contoh: 0812345"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kapasitasProduksi" className="text-emerald-900 font-semibold">Kapasitas (Kg/Bulan)</Label>
                    <Input 
                      id="kapasitasProduksi" 
                      type="number"
                      placeholder="Contoh: 500"
                      value={kapasitasProduksi}
                      onChange={(e) => setKapasitasProduksi(e.target.value)}
                      className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="desa" className="text-emerald-900 font-semibold">Desa/Gampong</Label>
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
                    <Label htmlFor="kecamatan" className="text-emerald-900 font-semibold">Kecamatan</Label>
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
                    <Label htmlFor="kabupaten" className="text-emerald-900 font-semibold">Kabupaten</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="alamatLengkap" className="text-emerald-900 font-semibold">Alamat Lengkap</Label>
                  <Input 
                    id="alamatLengkap" 
                    placeholder="Nama Jalan, RT/RW, Dusun"
                    value={alamatLengkap}
                    onChange={(e) => setAlamatLengkap(e.target.value)}
                    className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-emerald-900 font-semibold block">Mampu Pasok Grade Nilam:</Label>
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
              </>
            )}

            {/* ── BUYER FIELDS ─────────────────────────────────────────── */}
            {role === 'buyer' && (
              <>
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
                    <Label htmlFor="npwp" className="text-emerald-900 font-semibold">
                      NPWP (Nomor Pokok Wajib Pajak)
                    </Label>
                    <Input 
                      id="npwp" 
                      placeholder="00.000.000.0-000.000" 
                      value={npwp}
                      onChange={(e) => setNpwp(e.target.value)}
                      className="h-12 bg-white border-zinc-200 focus-visible:ring-emerald-500 font-medium text-zinc-800"
                      required 
                    />
                  </div>
                )}
              </>
            )}
            
            {/* Email & Password (Required for all roles) */}
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
                disabled={loading}
              >
                {loading ? (
                  t.form.btnLoading
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {t.form.btnSubmitPrefix} {role === 'supplier' ? 'Supplier' : 'Buyer'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </div>
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
