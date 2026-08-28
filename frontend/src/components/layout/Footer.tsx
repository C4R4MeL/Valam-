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
  TrendingUp
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
    perusahaan: false,
    kontak: false
  });

  const toggleAccordion = (section: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Fetch stats from Supabase on mount (Fallback if not provided as props)
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

        // 2. Fetch unique kabupaten and supplier count via secure RPC
        const { data: stats, error: statsErr } = await supabase
          .rpc('get_supplier_stats');

        if (stats && !statsErr) {
          const statsObj = stats as { active_koperasi_count: number; active_kabupaten_count: number };
          setActiveKoperasiCount(statsObj.active_koperasi_count || supplierCount || 5);
          setActiveKabupatenCount(statsObj.active_kabupaten_count || kabupatenCount || 5);
        }
      } catch (err) {
        console.warn('Footer statistics load warning - Using pre-seeded details:', err);
      }
    };

    fetchStats();
  }, [supplierCount, kabupatenCount]);

  // Handle Newsletter Subscribe
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Validate email
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
        if (error.code === '23505') { // Unique constraint violation
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
      console.error('Newsletter error:', err);
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

  // Human-readable labels for Grades
  const getGradeName = (gradeStr: string) => {
    if (gradeStr === 'GRADE_A') return 'Grade A (PA 30%+)';
    if (gradeStr === 'GRADE_B') return 'Grade B (PA 26%+)';
    if (gradeStr === 'GRADE_C') return 'Grade C (PA 22%+)';
    return gradeStr.replace('GRADE_', 'Grade ');
  };

  return (
    <footer className="w-full bg-[#05110a] text-zinc-300 border-t border-emerald-950/40 relative overflow-hidden select-none">
      {/* Visual background gradient glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle at 50% 0%, #064e3b 0%, transparent 65%)'
        }}
      />

      <div className="container mx-auto px-6 max-w-7xl relative z-10 pt-16 pb-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
          
          {/* Column 1 — Brand Section (4 Columns) */}
          <div className="lg:col-span-4 space-y-5">
            <Link className="flex items-center gap-2 group w-fit" href="/">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md border border-emerald-600/30">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-serif font-bold text-2xl text-white tracking-wide">
                Valam<span className="text-emerald-500">.</span>
              </span>
            </Link>
            
            <p className="font-semibold text-warm-50 text-xs md:text-sm font-serif leading-tight">
              {isId 
                ? 'Platform Perdagangan B2B Minyak Nilam Terpercaya & Terlacak' 
                : 'Trusted & Traceable Patchouli Oil B2B Trading Platform'}
            </p>

            <p className="text-xs text-warm-300 leading-relaxed font-light max-w-sm">
              {isId 
                ? 'Infrastruktur digital minyak nilam Indonesia dengan verifikasi laboratorium GC-MS terakreditasi dan ketertelusuran rantai pasok terintegrasi.' 
                : 'Indonesia\'s patchouli oil digital infrastructure featuring accredited GC-MS laboratory verification and integrated supply chain traceability.'}
            </p>

            {/* Coverage Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-900 border border-surface-700 text-xs text-warm-300 font-light backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-pulse" />
              <span>
                {isId 
                  ? `Melayani Koperasi Nilam dari ${activeKabupatenCount} Kabupaten di Aceh`
                  : `Serving Essential Oil Cooperatives across ${activeKabupatenCount} Aceh Counties`}
              </span>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a 
                href="https://linkedin.com/company/valam" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-primary/20 hover:text-emerald-400 transition-all flex items-center justify-center text-zinc-400"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com/valam.atsiri" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-primary/20 hover:text-emerald-400 transition-all flex items-center justify-center text-zinc-400"
              >
                <svg className="w-4 h-4" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a 
                href="https://wa.me/6281234567890" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-primary/20 hover:text-emerald-400 transition-all flex items-center justify-center text-zinc-400"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2 — Produk (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <button 
              onClick={() => toggleAccordion('produk')}
              className="w-full flex items-center justify-between lg:block text-left focus:outline-none"
            >
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-gold-500">
                {isId ? 'Produk & Layanan' : 'Products & Services'}
              </h4>
              <span className="lg:hidden text-zinc-400">
                {openAccordions.produk ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>
            
            <ul className={`space-y-2.5 transition-all duration-300 lg:block ${openAccordions.produk ? 'block' : 'hidden'}`}>
              <li>
                <Link href="/marketplace" className="text-xs font-light text-warm-300 hover:text-warm-50 transition-colors">
                  Marketplace B2B
                </Link>
              </li>
              <li>
                <Link href="/matching" className="text-xs font-light text-warm-300 hover:text-warm-50 transition-colors">
                  Smart Matching AI
                </Link>
              </li>
              <li>
                <Link href="/insights" className="text-xs font-light text-warm-300 hover:text-warm-50 transition-colors">
                  Valam Insights
                </Link>
              </li>
              <li>
                <Link href="/traceability/VAL-ACEH-001" className="text-xs font-light text-warm-300 hover:text-warm-50 transition-colors">
                  {isId ? 'Lacak Rantai Pasok' : 'Supply Chain Traceability'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 — Perusahaan (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <button 
              onClick={() => toggleAccordion('perusahaan')}
              className="w-full flex items-center justify-between lg:block text-left focus:outline-none"
            >
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-gold-500">
                {isId ? 'Perusahaan' : 'Company'}
              </h4>
              <span className="lg:hidden text-zinc-400">
                {openAccordions.perusahaan ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            <ul className={`space-y-2.5 transition-all duration-300 lg:block ${openAccordions.perusahaan ? 'block' : 'hidden'}`}>
              <li>
                <a href="#" className="text-xs font-light text-warm-300 hover:text-warm-50 transition-colors">
                  {isId ? 'Tentang Kami' : 'About Us'}
                </a>
              </li>
              <li>
                <a href="#" className="text-xs font-light text-warm-300 hover:text-warm-50 transition-colors">
                  {isId ? 'Cara Kerja' : 'How it Works'}
                </a>
              </li>
              <li>
                <Link href="/insights" className="text-xs font-light text-warm-300 hover:text-warm-50 transition-colors">
                  {isId ? 'Blog Atsiri' : 'Essential Blog'}
                </Link>
              </li>
              <li>
                <a href="#" className="text-xs font-light text-warm-300 hover:text-warm-50 transition-colors">
                  {isId ? 'Hubungi Kami' : 'Contact Us'}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4 — Kontak & Bantuan (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <button 
              onClick={() => toggleAccordion('kontak')}
              className="w-full flex items-center justify-between lg:block text-left focus:outline-none"
            >
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-gold-500">
                {isId ? 'Kontak & Bantuan' : 'Contact & Help'}
              </h4>
              <span className="lg:hidden text-zinc-400">
                {openAccordions.kontak ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            <ul className={`space-y-3 transition-all duration-300 lg:block ${openAccordions.kontak ? 'block' : 'hidden'}`}>
              <li className="flex items-start gap-2 text-xs font-light text-warm-300">
                <MapPin className="w-4 h-4 text-forest-500 shrink-0 mt-0.5" />
                <span>Basecamp Atsiri Center, Meulaboh, Aceh Barat</span>
              </li>
              <li className="flex items-center gap-2 text-xs font-light text-warm-300 hover:text-warm-50 transition-colors">
                <Mail className="w-4 h-4 text-forest-500 shrink-0" />
                <a href="mailto:support@valam.id">support@valam.id</a>
              </li>
              <li className="flex items-center gap-2 text-xs font-light text-warm-300 hover:text-warm-50 transition-colors">
                <Phone className="w-4 h-4 text-forest-500 shrink-0" />
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                  +62 812-3456-7890
                </a>
              </li>
              <li className="pt-1">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('valam_open_chat'))}
                  className="text-xs font-bold text-forest-500 hover:text-glow-forest transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {isId ? 'Bantuan Chatbot Nila' : 'Ask Nila Chatbot'} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5 — Newsletter (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-gold-500">
              {isId ? 'Berita Atsiri' : 'Newsletter'}
            </h4>
            <p className="text-xs text-warm-300 font-light leading-relaxed">
              {isId 
                ? 'Dapatkan update harga nilam mingguan dan analisis pasar langsung ke email Anda.' 
                : 'Get weekly patchouli prices and market analysis reports sent straight to your inbox.'}
            </p>

            <form onSubmit={handleNewsletterSubmit} className="space-y-2 mt-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isId ? 'Masukkan email...' : 'Enter email...'}
                  className="w-full bg-surface-900 border border-surface-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-warm-400 focus:outline-none focus:border-forest-500 transition-colors pr-10"
                  disabled={newsletterStatus === 'loading'}
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center cursor-pointer"
                  disabled={newsletterStatus === 'loading'}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {newsletterStatus === 'loading' && (
                <p className="text-[10px] text-warm-400 animate-pulse">
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

        {/* Live Market Price Ticker strip */}
        <div className="border-t border-emerald-950/40 py-5 my-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-950/10 rounded-xl px-5 border border-emerald-950/20 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-serif font-bold text-xs text-white tracking-wide flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              {isId ? 'Harga Nilam Hari Ini' : 'Live Patchouli Price'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {prices.map((p, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs">
                <span className="text-warm-300 font-light text-[10px] uppercase">
                  {getGradeName(p.grade)}:
                </span>
                <span className="font-bold text-white">
                  {formatRupiah(Number(p.price_per_kg))}
                  <span className="text-[10px] text-warm-400 font-light">/kg</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hairline Divider */}
        <div className="w-full h-px bg-emerald-950/40 mb-6" />

        {/* Bottom Bar: Legal Section & Language Selector */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-light text-warm-400">
          
          {/* Copyrights */}
          <div>
            © {new Date().getFullYear()} Valam. {isId ? 'Hak cipta dilindungi.' : 'All rights reserved.'}
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-warm-50 transition-colors">
              {isId ? 'Syarat & Ketentuan' : 'Terms & Conditions'}
            </a>
            <a href="#" className="hover:text-warm-50 transition-colors">
              {isId ? 'Kebijakan Privasi' : 'Privacy Policy'}
            </a>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-warm-400" />
            <button
              onClick={() => handleLocaleChange('id')}
              className={`hover:text-warm-50 transition-colors cursor-pointer ${isId ? 'text-gold-500 font-bold' : ''}`}
              disabled={isPending}
            >
              ID
            </button>
            <span className="text-zinc-700">|</span>
            <button
              onClick={() => handleLocaleChange('en')}
              className={`hover:text-warm-50 transition-colors cursor-pointer ${!isId ? 'text-gold-500 font-bold' : ''}`}
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
