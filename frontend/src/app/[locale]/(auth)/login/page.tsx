'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/routing'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useToast } from '@/hooks/use-toast'
import { Leaf, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useAuthContext } from '@/components/providers/AuthProvider'

const contentMap = {
  id: {
    hero: {
      badge: "B2B Premium Network",
      title1: "Portal menuju ",
      titleStrong: "kualitas nilam",
      title2: " terverifikasi.",
      desc: "Masuk untuk memantau inventori, mengelola RFQ, dan melacak status verifikasi laboratorium secara real-time."
    },
    form: {
      welcome: "Selamat Datang",
      desc: "Silakan masukkan kredensial Anda untuk masuk.",
      emailLabel: "Email Perusahaan",
      emailPlaceholder: "nama@perusahaan.com",
      pwdLabel: "Kata Sandi",
      forgotPwd: "Lupa kata sandi?",
      btnSubmit: "Masuk ke Dashboard",
      btnLoading: "Memverifikasi...",
      noAccount: "Belum memiliki akses ekosistem?",
      register: "Ajukan pendaftaran"
    },
    toast: {
      success: "Login Berhasil",
      successDesc: "Selamat datang kembali di ekosistem Valam.",
      mock: "Login Prototype Berhasil (Offline Mode)",
      mockDesc: "Masuk secara simulasi sebagai"
    }
  },
  en: {
    hero: {
      badge: "B2B Premium Network",
      title1: "Portal to verified ",
      titleStrong: "patchouli quality",
      title2: ".",
      desc: "Log in to monitor inventory, manage RFQs, and track lab verification status in real-time."
    },
    form: {
      welcome: "Welcome Back",
      desc: "Please enter your credentials to log in.",
      emailLabel: "Company Email",
      emailPlaceholder: "name@company.com",
      pwdLabel: "Password",
      forgotPwd: "Forgot password?",
      btnSubmit: "Go to Dashboard",
      btnLoading: "Verifying...",
      noAccount: "Don't have ecosystem access yet?",
      register: "Apply for registration"
    },
    toast: {
      success: "Login Successful",
      successDesc: "Welcome back to the Valam ecosystem.",
      mock: "Prototype Login Successful (Offline Mode)",
      mockDesc: "Simulated login as"
    }
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const { login: authLogin } = useAuthContext()
  
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { isApiError: true, message: errorData.message || 'Gagal login' };
      }

      const data = await response.json();
      
      // Simpan token via AuthContext (otomatis sync antar tab)
      authLogin({
        token: data.access_token,
        role: data.role,
        email: email,
        country: data.country || 'ID',
        name: data.name || email.split('@')[0],
      });

      toast({
        title: t.toast.success,
        description: t.toast.successDesc,
        variant: "default"
      });
      
      // Routing dinamis berdasarkan role asil dari database
      if (data.role === 'admin') {
        window.location.href = `/${locale}/dashboard/admin`;
      } else if (data.role === 'buyer') {
        window.location.href = `/${locale}/marketplace`;
      } else {
        window.location.href = `/${locale}/dashboard/supplier`;
      }
    } catch (error: any) {
      if (error?.isApiError) {
        toast({
          title: "Login Gagal",
          description: error.message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      console.warn("Backend login failed, using mock auth:", error);
      
      // MOCK LOGIN FALLBACK (Offline mode)
      let role = 'buyer';
      if (email.toLowerCase().includes('supplier') || password === 'supplier') role = 'supplier';
      if (email.toLowerCase().includes('admin') || password === 'admin') role = 'admin';
      
      let country = 'ID';
      const mockSavedCountry = localStorage.getItem('valam_registered_country_' + email);
      if (mockSavedCountry) {
        country = mockSavedCountry;
      } else if (email.includes('global') || email.includes('inter') || (email.includes('.com') && !email.includes('.id') && !email.includes('supplier'))) {
        country = 'US'; // default mock international country
      }
      
      authLogin({
        token: 'mock_token_123',
        role: role,
        email: email,
        country: country,
        name: email.split('@')[0],
      });

      toast({
        title: t.toast.mock,
        description: `${t.toast.mockDesc} ${role.toUpperCase()}`,
        variant: "default"
      });
      
      if (role === 'admin') {
        window.location.href = `/${locale}/dashboard/admin`;
      } else if (role === 'buyer') {
        window.location.href = `/${locale}/marketplace`;
      } else {
        window.location.href = `/${locale}/dashboard/supplier`;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex w-full bg-zinc-50">
      
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-emerald-950 flex-col justify-between overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/digital_map.png" 
            alt="Valam Ecosystem" 
            fill 
            className="object-cover opacity-30 mix-blend-overlay"
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
              {t.hero.title1}<span className="italic text-gold-300">{t.hero.titleStrong}</span>{t.hero.title2}
            </h1>
            <p className="text-emerald-100/70 text-lg">
              {t.hero.desc}
            </p>
          </div>
          
          <div className="mt-12 flex items-center gap-4 text-emerald-100/50 text-sm">
            <span>© 2026 Valam Ecosystem</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:h-full lg:overflow-y-auto">
        <div className="w-full max-w-md space-y-10 my-auto">
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
          <div className="lg:hidden flex justify-center mb-8">
            <Link className="flex items-center gap-2 group" href="/">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-serif font-bold text-2xl tracking-tight text-emerald-950">
                Valam<span className="text-gold-500">.</span>
              </span>
            </Link>
          </div>

          <div className="space-y-3 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-emerald-950">{t.form.welcome}</h2>
            <p className="text-muted-foreground">{t.form.desc}</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-emerald-900 font-semibold">{t.form.pwdLabel}</Label>
                <Link href="/forgot-password" className="text-sm font-medium text-emerald-600 hover:text-emerald-800 hover:underline transition-colors">
                  {t.form.forgotPwd}
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••" 
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
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-emerald-900 hover:bg-emerald-950 text-white font-medium shadow-lg shadow-emerald-900/20 transition-all group" 
              disabled={loading}
            >
              {loading ? (
                t.form.btnLoading
              ) : (
                <span className="flex items-center gap-2">
                  {t.form.btnSubmit}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>
          
          <div className="text-center text-sm text-zinc-500">
            {t.form.noAccount}{" "}
            <Link href="/register" className="font-semibold text-emerald-700 hover:text-emerald-900 hover:underline transition-colors">
              {t.form.register}
            </Link>
          </div>

        </div>
      </div>
      
    </div>
  )
}
