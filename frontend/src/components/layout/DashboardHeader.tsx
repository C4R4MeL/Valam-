'use client'

import { usePathname, Link } from '@/i18n/routing'
import { useLocale } from 'next-intl'
import { LayoutDashboard, FileCheck, ClipboardList, Wallet, Send, Sparkles, ShoppingBag, Beaker, Users, ArrowLeft, Recycle } from 'lucide-react'

const headerContent = {
  id: {
    matching: { title: "Smart Matching", subtitle: "Temukan suplai minyak nilam yang sesuai dengan kriteria industri Anda." },
    orders: { title: "My Orders", subtitle: "Pantau status pengiriman dan pembayaran pesanan Anda." },
    rfq: { title: "Request for Quotation", subtitle: "Ajukan permintaan pasokan khusus kepada jaringan supplier." },
    inventory: { title: "Inventori Batch", subtitle: "Kelola ketersediaan stok minyak nilam Anda." },
    addBatch: { title: "Tambah Batch", subtitle: "Daftarkan hasil panen baru untuk uji lab dan sertifikasi CoA." },
    supplierOrders: { title: "Pesanan Masuk", subtitle: "Kelola pesanan dari buyer dan proses pengiriman." },
    wallet: { title: "Dompet Digital", subtitle: "Pantau pendapatan, saldo escrow, dan riwayat penarikan." },
    supplierRfq: { title: "Peluang RFQ", subtitle: "Papan permintaan pasokan dari buyer global." },
    qc: { title: "Antrian QC Lab", subtitle: "Verifikasi sampel minyak nilam dan terbitkan Certificate of Analysis." },
    adminSuppliers: { title: "Validasi Supplier", subtitle: "Periksa dan setujui pendaftaran supplier baru." },
    buyer: { title: "Beranda Buyer", subtitle: "Ringkasan aktivitas pengadaan minyak nilam Anda." },
    supplier: { title: "Supplier Dashboard", subtitle: "Ringkasan performa dan penjualan Anda." },
    admin: { title: "Admin Dashboard", subtitle: "Pusat kendali ekosistem Valam." },
    default: { title: "Dashboard", subtitle: "Kelola aktivitas Anda di ekosistem Valam." }
  },
  en: {
    matching: { title: "Smart Matching", subtitle: "Find patchouli oil supplies that match your industry criteria." },
    orders: { title: "My Orders", subtitle: "Track the shipping and payment status of your orders." },
    rfq: { title: "Request for Quotation", subtitle: "Submit specific supply requests to our supplier network." },
    inventory: { title: "Batch Inventory", subtitle: "Manage the availability of your patchouli oil stock." },
    addBatch: { title: "Add Batch", subtitle: "Register new harvests for lab testing and CoA certification." },
    supplierOrders: { title: "Incoming Orders", subtitle: "Manage buyer orders and process shipments." },
    wallet: { title: "Digital Wallet", subtitle: "Monitor revenue, escrow balances, and withdrawal history." },
    supplierRfq: { title: "RFQ Opportunities", subtitle: "Board for supply requests from global buyers." },
    qc: { title: "Lab QC Queue", subtitle: "Verify patchouli oil samples and issue Certificates of Analysis." },
    adminSuppliers: { title: "Supplier Validation", subtitle: "Review and approve new supplier registrations." },
    buyer: { title: "Buyer Dashboard", subtitle: "Overview of your patchouli oil procurement activities." },
    supplier: { title: "Supplier Dashboard", subtitle: "Overview of your performance and sales." },
    admin: { title: "Admin Dashboard", subtitle: "Command center of the Valam ecosystem." },
    default: { title: "Dashboard", subtitle: "Manage your activities in the Valam ecosystem." }
  }
}

interface DashboardHeaderProps {
  title?: string
  subtitle?: string
}

export function DashboardHeader({ title: propTitle, subtitle: propSubtitle }: DashboardHeaderProps = {}) {
  const pathname = usePathname()
  const locale = useLocale() as 'id' | 'en'
  const t = headerContent[locale] || headerContent.id

  let defaultTitle = t.default.title
  let defaultSubtitle = t.default.subtitle

  let title = defaultTitle
  let subtitle = defaultSubtitle

  if (pathname.includes('/buyer/matching')) {
    title = t.matching.title
    subtitle = t.matching.subtitle
  } else if (pathname.includes('/buyer/orders')) {
    title = t.orders.title
    subtitle = t.orders.subtitle
  } else if (pathname.includes('/buyer/rfq')) {
    title = t.rfq.title
    subtitle = t.rfq.subtitle
  } else if (pathname.includes('/supplier/inventory')) {
    title = t.inventory.title
    subtitle = t.inventory.subtitle
  } else if (pathname.includes('/supplier/add-batch')) {
    title = t.addBatch.title
    subtitle = t.addBatch.subtitle
  } else if (pathname.includes('/supplier/orders')) {
    title = t.supplierOrders.title
    subtitle = t.supplierOrders.subtitle
  } else if (pathname.includes('/supplier/wallet')) {
    title = t.wallet.title
    subtitle = t.wallet.subtitle
  } else if (pathname.includes('/supplier/rfq')) {
    title = t.supplierRfq.title
    subtitle = t.supplierRfq.subtitle
  } else if (pathname.includes('/admin/qc')) {
    title = t.qc.title
    subtitle = t.qc.subtitle
  } else if (pathname.includes('/admin/suppliers')) {
    title = t.adminSuppliers.title
    subtitle = t.adminSuppliers.subtitle
  } else if (pathname.includes('/buyer')) {
    title = t.buyer.title
    subtitle = t.buyer.subtitle
  } else if (pathname.includes('/supplier')) {
    title = t.supplier.title
    subtitle = t.supplier.subtitle
  } else if (pathname.includes('/admin')) {
    title = t.admin.title
    subtitle = t.admin.subtitle
  } else {
    return null;
  }

  // Render tabs based on path
  const isSupplier = pathname.includes('/supplier')
  const isBuyer = pathname.includes('/buyer')
  const isAdmin = pathname.includes('/admin')

  let tabs: any[] = []

  if (isSupplier) {
    tabs = [
      { name: locale === 'id' ? 'Ringkasan' : 'Overview', href: '/dashboard/supplier', icon: LayoutDashboard, exact: true },
      { name: locale === 'id' ? 'Tambah Batch' : 'Add Batch', href: '/dashboard/supplier/add-batch', icon: FileCheck },
      { name: locale === 'id' ? 'Inventori' : 'Inventory', href: '/dashboard/supplier/inventory', icon: ClipboardList },
      { name: locale === 'id' ? 'Circular Products' : 'Circular Products', href: '/dashboard/supplier/circular', icon: Recycle },
      { name: locale === 'id' ? 'Peluang RFQ' : 'RFQ Opportunities', href: '/dashboard/supplier/rfq', icon: Send },
      { name: locale === 'id' ? 'Pesanan Masuk' : 'Incoming Orders', href: '/dashboard/supplier/orders', icon: ShoppingBag },
      { name: locale === 'id' ? 'Dompet Digital' : 'Digital Wallet', href: '/dashboard/supplier/wallet', icon: Wallet },
    ]
  } else if (isBuyer) {
    tabs = [
      { name: locale === 'id' ? 'Smart Matching' : 'Smart Matching', href: '/dashboard/buyer/matching', icon: Sparkles },
      { name: locale === 'id' ? 'Request RFQ' : 'Request RFQ', href: '/dashboard/buyer/rfq', icon: Send },
      { name: locale === 'id' ? 'Pesanan Saya' : 'My Orders', href: '/dashboard/buyer/orders', icon: ShoppingBag },
    ]
  } else if (isAdmin) {
    tabs = [
      { name: locale === 'id' ? 'Ringkasan' : 'Overview', href: '/dashboard/admin', icon: LayoutDashboard, exact: true },
      { name: locale === 'id' ? 'Validasi Supplier' : 'Supplier Validation', href: '/dashboard/admin/suppliers', icon: Users },
      { name: locale === 'id' ? 'Antrian QC Lab' : 'Lab QC Queue', href: '/dashboard/admin/qc', icon: Beaker },
    ]
  }

  const displayTitle = propTitle || title
  const displaySubtitle = propSubtitle || subtitle

  const isSupplierRoot = pathname === '/dashboard/supplier' || pathname === '/id/dashboard/supplier' || pathname === '/en/dashboard/supplier'
  const isBuyerRoot = pathname === '/dashboard/buyer' || pathname === '/id/dashboard/buyer' || pathname === '/en/dashboard/buyer'
  const isAdminRoot = pathname === '/dashboard/admin' || pathname === '/id/dashboard/admin' || pathname === '/en/dashboard/admin'
  const isRootDashboard = isSupplierRoot || isBuyerRoot || isAdminRoot

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <h1 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900 tracking-tight">
        {displayTitle}
      </h1>
      <p className="text-zinc-500 text-sm mt-1">
        {displaySubtitle}
      </p>
    </div>
  )
}
