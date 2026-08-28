'use client';

import { useState, useEffect, useTransition } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { 
  Leaf, 
  Phone, 
  MapPin, 
  Mail, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface FooterProps {
  marketPrices?: Array<{ grade: string; price_per_kg: number }>;
  supplierCount?: number;
  kabupatenCount?: number;
}

export function Footer({ marketPrices, supplierCount, kabupatenCount }: FooterProps) {
  const locale = useLocale() as 'id' | 'en';
  const isId = locale === 'id';
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local state for dynamic database stats
  const [prices, setPrices] = useState<any[]>(marketPrices || [
    { grade: 'GRADE_A', price_per_kg: 850000 },
    { grade: 'GRADE_B', price_per_kg: 780000 },
    { grade: 'GRADE_C', price_per_kg: 680000 }
  ]);
  const [activeKoperasiCount, setActiveKoperasiCount] = useState<number>(supplierCount || 5);
  const [activeKabupatenCount, setActiveKabupatenCount] = useState<number>(kabupatenCount || 5);

  // Newsletter states
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Mobile Accordion state
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    produk: false,
    layanan: false,
    kontak: false
  });

  const toggleAccordion = (section: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Fetch stats from Supabase on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient();
        
        // 1. Fetch market prices
        const { data: priceData, error: priceErr } = await supabase
          .from('insights_market_prices')
          .select('grade, price_per_kg')
          .order('grade', { ascending: true });
        
        if (priceData && priceData.length > 0 && !priceErr) {
          setPrices(priceData);
        }

        // 2. Fetch unique kabupaten and supplier count
        const { data: stats, error: statsErr } = await supabase
          .rpc('get_supplier_stats');

        if (stats && !statsErr) {
          const statsObj = stats as { active_koperasi_count: number; active_kabupaten_count: number };
          setActiveKoperasiCount(statsObj.active_koperasi_count || supplierCount || 5);
          setActiveKabupatenCount(statsObj.active_kabupaten_count || kabupatenCount || 5);
        }
      } catch (err) {
        // graceful fallback to defaults
      }
    };

    fetchStats();
  }, [supplierCount, kabupatenCount]);

  // Handle Newsletter Subscribe
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setNewsletterStatus('error');
      setErrorMessage(isId ? 'Format email tidak valid.' : 'Invalid email format.');
      return;
    }

    setNewsletterStatus('loading');
    setErrorMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email: email.toLowerCase() }]);

      if (error) {
        if (error.code === '23505') {
          setNewsletterStatus('error');
          setErrorMessage(isId ? 'Email ini sudah terdaftar.' : 'This email is already subscribed.');
        } else {
          throw error;
        }
      } else {
        setNewsletterStatus('success');
        setEmail('');
        setTimeout(() => setNewsletterStatus('idle'), 5000);
      }
    } catch (err) {
      setNewsletterStatus('error');
      setErrorMessage(isId ? 'Terjadi kesalahan. Silakan coba lagi.' : 'Something went wrong. Please try again.');
    }
  };

  const handleLocaleChange = (newLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val).replace('Rp', 'Rp ');
  };

  const getGradeName = (gradeStr: string) => {
    if (gradeStr === 'GRADE_A') return 'Grade A (PA 30%+)';
    if (gradeStr === 'GRADE_B') return 'Grade B (PA 26%+)';
    if (gradeStr === 'GRADE_C') return 'Grade C (PA 22%+)';
    return gradeStr.replace('GRADE_', 'Grade ');
  };

  return (
    <footer className="w-full bg-[#06140D] text-zinc-300 border-t border-emerald-900/30 relative overflow-hidden select-none">
      {/* Visual background ambient gradient glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, #104C2E 0%, transparent 70%)'
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10 pt-16 pb-10">
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ─── MAIN FOOTER GRID ─── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-12">
          
          {/* Column 1 — Brand Identity (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link className="flex items-center gap-2.5 group w-fit" href="/">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/30 border border-emerald-400/20 group-hover:scale-105 transition-transform">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-serif font-bold text-2xl text-white tracking-wide">
                Valam<span className="text-[#B69A1D]">.</span>
              </span>
            </Link>
            
            <p className="font-serif text-sm font-semibold text-emerald-200/90 leading-snug">
              {isId 
                ? 'Platform Perdagangan B2B Minyak Nilam Terpercaya & Terlacak' 
                : 'Trusted & Traceable Patchouli Oil B2B Trading Platform'}
            </p>

            <p className="text-xs text-zinc-400 leading-relaxed font-normal max-w-sm">
              {isId 
                ? 'Infrastruktur digital minyak nilam Indonesia yang menghubungkan koperasi petani dengan industri global melalui verifikasi uji lab GC-MS, kepatuhan regulasi EUDR, dan sistem pembayaran escrow aman.' 
                : 'Indonesia\'s patchouli oil digital trading infrastructure connecting local farmer cooperatives with global buyers through accredited GC-MS lab testing, EUDR compliance, and secure escrow.'}
            </p>

            {/* Coverage Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-xs text-emerald-300 backdrop-blur-sm shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-medium text-[11px]">
                {isId 
                  ? `Sentra Koperasi Mitra: ${activeKabupatenCount} Kabupaten di Aceh`
                  : `Partner Cooperatives across ${activeKabupatenCount} Aceh Regencies`}
              </span>
            </div>

            {/* Social & Contact Icons */}
            <div className="flex items-center gap-2.5 pt-1">
              <a 
                href="https://linkedin.com/company/valam" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/40 hover:text-emerald-300 transition-all flex items-center justify-center text-zinc-400"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com/valam.atsiri" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Instagram"
                className="w-8 h-8 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/40 hover:text-emerald-300 transition-all flex items-center justify-center text-zinc-400"
              >
                <svg className="w-3.5 h-3.5" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a 
                href="https://wa.me/6281234567890" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="WhatsApp"
                className="w-8 h-8 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/40 hover:text-emerald-300 transition-all flex items-center justify-center text-zinc-400"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
              <a 
                href="mailto:support@valam.id" 
                aria-label="Email"
                className="w-8 h-8 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/40 hover:text-emerald-300 transition-all flex items-center justify-center text-zinc-400"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Column 2 — Produk & Ekosistem (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <button 
              onClick={() => toggleAccordion('produk')}
              className="w-full flex items-center justify-between lg:block text-left focus:outline-none cursor-pointer py-1"
            >
              <h4 className="font-serif font-bold text-xs uppercase tracking-widest text-[#B69A1D]">
                {isId ? 'Produk & Ekosistem' : 'Ecosystem'}
              </h4>
              <span className="lg:hidden text-zinc-500">
                {openAccordions.produk ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>
            
            <ul className={`space-y-2.5 transition-all duration-300 lg:block ${openAccordions.produk ? 'block' : 'hidden'}`}>
              <li>
                <Link href="/marketplace" className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                  Marketplace Minyak Nilam
                </Link>
              </li>
              <li>
                <Link href="/marketplace?tab=circular" className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                  Produk Sirkular
                </Link>
              </li>
              <li>
                <Link href="/matching" className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                  Smart Matching AI
                </Link>
              </li>
              <li>
                <Link href="/insights" className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                  Valam Insights & Harga
                </Link>
              </li>
              <li>
                <Link href="/traceability/VAL-ACEH-001" className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                  {isId ? 'Ketertelusuran Batch' : 'Batch Traceability'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 — Layanan & Standar (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <button 
              onClick={() => toggleAccordion('layanan')}
              className="w-full flex items-center justify-between lg:block text-left focus:outline-none cursor-pointer py-1"
            >
              <h4 className="font-serif font-bold text-xs uppercase tracking-widest text-[#B69A1D]">
                {isId ? 'Layanan & Mutu' : 'Services & Quality'}
              </h4>
              <span className="lg:hidden text-zinc-500">
                {openAccordions.layanan ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            <ul className={`space-y-2.5 transition-all duration-300 lg:block ${openAccordions.layanan ? 'block' : 'hidden'}`}>
              <li>
                <Link href="/insights" className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                  {isId ? 'Uji Lab GC-MS' : 'GC-MS Testing'}
                </Link>
              </li>
              <li>
                <Link href="/insights" className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                  {isId ? 'Digital CoA (Sertifikat)' : 'Digital CoA'}
                </Link>
              </li>
              <li>
                <Link href="/buyer/orders" className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                  {isId ? 'Escrow Transaksi Aman' : 'Escrow Protection'}
                </Link>
              </li>
              <li>
                <Link href="/insights" className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
                  {isId ? 'Kepatuhan EUDR Ekspor' : 'EUDR Compliance'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 — Kontak & Dukungan (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <button 
              onClick={() => toggleAccordion('kontak')}
              className="w-full flex items-center justify-between lg:block text-left focus:outline-none cursor-pointer py-1"
            >
              <h4 className="font-serif font-bold text-xs uppercase tracking-widest text-[#B69A1D]">
                {isId ? 'Hubungi Kami' : 'Contact Us'}
              </h4>
              <span className="lg:hidden text-zinc-500">
                {openAccordions.kontak ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            <ul className={`space-y-3 transition-all duration-300 lg:block ${openAccordions.kontak ? 'block' : 'hidden'}`}>
              <li className="flex items-start gap-2 text-xs text-zinc-400">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">Sentra Atsiri Aceh, Banda Aceh & Meulaboh</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="mailto:support@valam.id">support@valam.id</a>
              </li>
              <li className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                  +62 812-3456-7890
                </a>
              </li>
              <li className="pt-1">
                <Link
                  href="/chat"
                  className="w-full text-left inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B69A1D] group-hover:scale-110 transition-transform" />
                  <span>{isId ? 'Tanya Nila (AI Assistant)' : 'Ask Nila AI'}</span>
                  <ArrowRight className="w-3 h-3 ml-auto text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5 — Newsletter (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-serif font-bold text-xs uppercase tracking-widest text-[#B69A1D]">
              {isId ? 'Warta Pasar' : 'Market Digest'}
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {isId 
                ? 'Dapatkan pembaruan tren harga nilam dan riset pasar atsiri mingguan.' 
                : 'Weekly patchouli price trends and market intelligence reports directly to your inbox.'}
            </p>

            <form onSubmit={handleNewsletterSubmit} className="space-y-2 pt-1">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isId ? 'Alamat email Anda...' : 'Your email address...'}
                  className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all pr-9"
                  disabled={newsletterStatus === 'loading'}
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="absolute right-1 top-1 bottom-1 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition-colors flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-50"
                  disabled={newsletterStatus === 'loading'}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {newsletterStatus === 'loading' && (
                <p className="text-[10px] text-zinc-400 animate-pulse">
                  {isId ? 'Mendaftarkan...' : 'Subscribing...'}
                </p>
              )}

              {newsletterStatus === 'success' && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] leading-tight">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{isId ? 'Berhasil berlangganan!' : 'Subscribed successfully!'}</span>
                </div>
              )}

              {newsletterStatus === 'error' && (
                <div className="flex items-center gap-1.5 text-rose-400 text-[10px] leading-tight">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </form>
          </div>

        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ─── LIVE MARKET PRICE TICKER STRIP ─── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="border border-emerald-900/40 bg-emerald-950/20 backdrop-blur-md rounded-2xl p-4 sm:px-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-inner">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="font-serif font-bold text-xs text-white uppercase tracking-wider">
                {isId ? 'Live Pasar Nilam Hari Ini' : 'Live Patchouli Market Price'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {prices.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-black/30 border border-emerald-900/30 px-3 py-1.5 rounded-lg text-xs">
                <span className="text-zinc-400 text-[11px] font-medium">
                  {getGradeName(p.grade)}:
                </span>
                <span className="font-bold text-emerald-300 font-mono">
                  {formatRupiah(Number(p.price_per_kg))}
                  <span className="text-[10px] text-zinc-500 font-normal ml-0.5">/kg</span>
                </span>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-zinc-400 hidden lg:block shrink-0">
            {isId ? 'Data riil agregasi transaksi sentra Aceh' : 'Aggregated from Aceh distillation hubs'}
          </div>
        </div>

        {/* Hairline Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-900/40 to-transparent mb-6" />

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ─── BOTTOM LEGAL & LANGUAGE BAR ─── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          
          {/* Copyrights */}
          <div className="text-center sm:text-left">
            © {new Date().getFullYear()} <strong className="text-zinc-300 font-semibold">VALAM Indonesia</strong>. {isId ? 'Seluruh hak cipta dilindungi.' : 'All rights reserved.'}
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-5 text-[11px]">
            <Link href="/insights" className="hover:text-zinc-200 transition-colors">
              {isId ? 'Syarat & Ketentuan' : 'Terms & Conditions'}
            </Link>
            <span className="text-zinc-700">•</span>
            <Link href="/insights" className="hover:text-zinc-200 transition-colors">
              {isId ? 'Kebijakan Privasi' : 'Privacy Policy'}
            </Link>
            <span className="text-zinc-700">•</span>
            <Link href="/insights" className="hover:text-zinc-200 transition-colors">
              {isId ? 'Sertifikasi & Kepatuhan' : 'Certifications'}
            </Link>
          </div>

          {/* Language Selector Pill */}
          <div className="inline-flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 rounded-full px-2.5 py-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-zinc-400 mr-1" />
            <button
              onClick={() => handleLocaleChange('id')}
              className={`px-2 py-0.5 rounded-full text-[11px] transition-all cursor-pointer ${
                isId 
                  ? 'bg-emerald-950 text-[#B69A1D] font-bold border border-emerald-800/40 shadow-2xs' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              disabled={isPending}
            >
              ID
            </button>
            <button
              onClick={() => handleLocaleChange('en')}
              className={`px-2 py-0.5 rounded-full text-[11px] transition-all cursor-pointer ${
                !isId 
                  ? 'bg-emerald-950 text-[#B69A1D] font-bold border border-emerald-800/40 shadow-2xs' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              disabled={isPending}
            >
              EN
            </button>
          </div>

        </div>

      </div>
    </footer>
  );
}
