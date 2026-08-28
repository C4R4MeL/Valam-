'use client'

import { useState, useEffect } from 'react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Wallet, ArrowUpRight, ArrowDownRight, Building2, Calendar, AlertCircle, CreditCard, Plus, PhoneCall, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from '@/i18n/routing'
import { useLocale } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'

const contentMap = {
  id: {
    title: "Dompet Saya",
    subtitle: "Kelola saldo dan penarikan dana dari penjualan Anda",
    balance: "Saldo Tersedia",
    btnWithdraw: "Tarik Dana",
    history: "Riwayat Transaksi",
    empty: "Belum ada transaksi",
    withdrawTitle: "Tarik Dana",
    withdrawDesc: "Dana akan ditransfer ke rekening bank Anda dalam 1-2 hari kerja.",
    amountLabel: "Jumlah Penarikan (Rp)",
    bankLabel: "Pilih / Input Informasi Rekening Bank",
    btnSubmit: "Ajukan Penarikan",
    stats: {
      earnings: "Total Pendapatan",
      withdrawn: "Total Ditarik",
      pending: "Menunggu Penarikan"
    },
    bankCard: {
      title: "Rekening Bank Utama",
      empty: "Belum ada rekening terhubung",
      btnLink: "Hubungkan Rekening",
      linkedSuccess: "Rekening bank berhasil disimpan"
    },
    supportCard: {
      title: "Bantuan Keuangan",
      desc: "Punya kendala dengan pencairan dana? Tim finansial kami siap membantu Anda 24/7."
    }
  },
  en: {
    title: "My Wallet",
    subtitle: "Manage your balance and withdrawals from your sales",
    balance: "Available Balance",
    btnWithdraw: "Withdraw Funds",
    history: "Transaction History",
    empty: "No transactions yet",
    withdrawTitle: "Withdraw Funds",
    withdrawDesc: "Funds will be transferred to your bank account in 1-2 business days.",
    amountLabel: "Withdrawal Amount (IDR)",
    bankLabel: "Select / Input Bank Account Details",
    btnSubmit: "Submit Withdrawal",
    stats: {
      earnings: "Total Earnings",
      withdrawn: "Total Withdrawn",
      pending: "Pending Clearance"
    },
    bankCard: {
      title: "Primary Bank Account",
      empty: "No bank account linked",
      btnLink: "Link Bank Account",
      linkedSuccess: "Bank account saved successfully"
    },
    supportCard: {
      title: "Financial Support",
      desc: "Having issues with your withdrawals? Our finance team is here to assist you 24/7."
    }
  }
}

export default function SupplierWalletPage() {
  const [wallet, setWallet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [bankInfo, setBankInfo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false)

  // Custom Bank Account State
  const [linkedBank, setLinkedBank] = useState<string>('')

  const { toast } = useToast()
  const router = useRouter()
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id

  const email = typeof window !== 'undefined' ? (localStorage.getItem('valam_email') || 'supplier@valam.id') : 'supplier@valam.id'

  const fetchWallet = async () => {
    try {
      const token = localStorage.getItem('valam_token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'}/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        setWallet(data)
      } else {
        throw new Error('API unreachable')
      }
    } catch (err) {
      console.warn("Backend offline, loading mock wallet:", err)
      const localWalletKey = 'valam_supplier_wallet_' + email
      const stored = localStorage.getItem(localWalletKey)
      if (stored) {
        setWallet(JSON.parse(stored))
      } else {
        const initialWallet = {
          balance: email === 'supplier1@gmail.com' || email === 'supplier@valam.id' ? 45000000 : 0,
          transactions: email === 'supplier1@gmail.com' || email === 'supplier@valam.id' ? [
            {
              id: 'tx_1',
              description: 'Penjualan Batch B-ACEH-901',
              type: 'CREDIT',
              amount: 45000000,
              created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
              status: 'COMPLETED'
            }
          ] : []
        }
        localStorage.setItem(localWalletKey, JSON.stringify(initialWallet))
        setWallet(initialWallet)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWallet()

    // Fetch bank info
    const storedBank = localStorage.getItem('valam_bank_account_info_' + email)
    if (storedBank) {
      setLinkedBank(storedBank)
      setBankInfo(storedBank)
    }
  }, [email])

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const amount = parseFloat(withdrawAmount)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'

    try {
      const token = localStorage.getItem('valam_token')
      if (amount > wallet.balance) {
        toast({ title: "Gagal", description: "Saldo tidak mencukupi", variant: "destructive" })
        setIsSubmitting(false)
        return
      }

      const res = await fetch(`${API_URL}/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, bankDetails: bankInfo })
      })

      if (res.ok) {
        toast({ title: "Berhasil", description: "Permintaan penarikan dana berhasil diajukan" })
        setIsDialogOpen(false)
        setWithdrawAmount('')
        fetchWallet()
      } else {
        throw new Error('API failed')
      }
    } catch (err) {
      console.warn("Backend offline, updating local wallet info:", err)
      const localWalletKey = 'valam_supplier_wallet_' + email

      if (amount > wallet.balance) {
        toast({ title: "Gagal", description: "Saldo tidak mencukupi", variant: "destructive" })
        setIsSubmitting(false)
        return
      }

      const updatedWallet = {
        balance: wallet.balance - amount,
        transactions: [
          {
            id: 'tx_w_' + Math.random().toString(36).substring(2, 9),
            description: `Penarikan Dana ke ${bankInfo.split(' - ')[0] || 'Bank'}`,
            type: 'DEBIT',
            amount: amount,
            created_at: new Date().toISOString(),
            status: 'PENDING'
          },
          ...wallet.transactions
        ]
      }

      localStorage.setItem(localWalletKey, JSON.stringify(updatedWallet))
      setWallet(updatedWallet)

      // Auto-save the bank account details
      if (bankInfo !== linkedBank) {
        localStorage.setItem('valam_bank_account_info_' + email, bankInfo)
        setLinkedBank(bankInfo)
      }

      toast({ title: "Berhasil (Mock)", description: "Permintaan penarikan dana diajukan secara lokal." })
      setIsDialogOpen(false)
      setWithdrawAmount('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLinkBank = (e: React.FormEvent) => {
    e.preventDefault()
    if (bankInfo.trim()) {
      localStorage.setItem('valam_bank_account_info_' + email, bankInfo)
      setLinkedBank(bankInfo)
      setIsBankDialogOpen(false)
      toast({ title: "Berhasil", description: t.bankCard.linkedSuccess })
    }
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
  }

  // Calculate stats
  const totalEarnings = wallet?.transactions
    ?.filter((t: any) => t.type === 'CREDIT' && t.status === 'COMPLETED')
    ?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0

  const totalWithdrawn = wallet?.transactions
    ?.filter((t: any) => t.type === 'DEBIT')
    ?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0

  if (loading) {
    return <div className="py-12 text-center text-zinc-500 min-h-[70vh]">Loading...</div>
  }

  return (
    <div className="w-full flex flex-col min-h-[75vh] pb-16">
      <DashboardHeader
        title={t.title}
        subtitle={t.subtitle}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Top 3 Metric Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* AVAILABLE BALANCE CARD */}
          <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[160px] border border-emerald-850 hover:shadow-lg transition-all duration-300 group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />

            <div>
              <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">{t.balance}</p>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif tracking-tight">
                {formatRupiah(wallet?.balance || 0)}
              </h2>
            </div>

            <div className="mt-4 pt-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger className="bg-[#B69A1D] hover:bg-[#a68c19] text-emerald-950 font-bold h-11 w-full rounded-xl transition-all shadow-md shadow-[#B69A1D]/10 inline-flex items-center justify-center cursor-pointer">
                    <ArrowUpRight className="w-4 h-4 mr-1.5" />
                    {t.btnWithdraw}
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white rounded-2xl border-none shadow-2xl p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-serif font-bold text-zinc-900">{t.withdrawTitle}</DialogTitle>
                    <DialogDescription className="text-zinc-500 text-sm">
                      {t.withdrawDesc}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleWithdraw} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-zinc-700 font-semibold text-xs">{t.amountLabel}</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium text-sm">Rp</span>
                        <Input
                          id="amount"
                          type="number"
                          required
                          max={wallet?.balance}
                          value={withdrawAmount}
                          onChange={e => setWithdrawAmount(e.target.value)}
                          className="h-12 border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-emerald-500 pl-10 rounded-xl font-medium text-zinc-800"
                          placeholder="Contoh: 5000000"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-400 flex justify-between">
                        <span>Min: Rp 10.000</span>
                        <span>Maks: <span className="font-semibold text-emerald-600">{formatRupiah(wallet?.balance || 0)}</span></span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bank" className="text-zinc-700 font-semibold text-xs">{t.bankLabel}</Label>
                      <Input
                        id="bank"
                        required
                        value={bankInfo}
                        onChange={e => setBankInfo(e.target.value)}
                        className="h-12 border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded-xl font-medium text-zinc-800"
                        placeholder="Contoh: BCA - 1234567890 - John Doe"
                      />
                    </div>

                    <Button type="submit" disabled={isSubmitting || !withdrawAmount || !bankInfo} className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl mt-4 transition-all">
                      {isSubmitting ? "Memproses..." : t.btnSubmit}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* TOTAL EARNINGS CARD */}
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px] hover:shadow-md transition-all duration-300">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">{t.stats.earnings}</p>
              <h2 className="text-3xl font-bold font-serif text-emerald-950">
                {formatRupiah(totalEarnings)}
              </h2>
            </div>
            <div className="flex items-center text-xs text-zinc-500 pt-2 border-t border-zinc-100">
              <ArrowDownRight className="w-4 h-4 text-emerald-600 mr-1" />
              <span>Pendapatan Kotor Berhasil Diterima</span>
            </div>
          </div>

          {/* TOTAL WITHDRAWN CARD */}
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px] hover:shadow-md transition-all duration-300">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">{t.stats.withdrawn}</p>
              <h2 className="text-3xl font-bold font-serif text-zinc-800">
                {formatRupiah(totalWithdrawn)}
              </h2>
            </div>
            <div className="flex items-center text-xs text-zinc-500 pt-2 border-t border-zinc-100">
              <ArrowUpRight className="w-4 h-4 text-amber-500 mr-1" />
              <span>Total Dana Ditransfer Ke Rekening</span>
            </div>
          </div>

        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: TRANSACTION HISTORY (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-zinc-900">{t.history}</h3>
                <span className="text-xs text-zinc-400 font-medium">Updated live</span>
              </div>

              {(!wallet?.transactions || wallet.transactions.length === 0) ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                    <Calendar className="w-7 h-7 text-zinc-300" />
                  </div>
                  <p className="text-zinc-400 font-medium text-sm">{t.empty}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {wallet.transactions.map((trx: any) => (
                    <div key={trx.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 hover:bg-zinc-50/50 hover:border-zinc-200 transition-all duration-200">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${trx.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {trx.type === 'CREDIT' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-zinc-800">{trx.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-zinc-400">
                              {new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(trx.created_at))}
                            </span>
                            {trx.status === 'PENDING' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                PENDING
                              </span>
                            )}
                            {trx.status === 'COMPLETED' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150">
                                BERHASIL
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${trx.type === 'CREDIT' ? 'text-emerald-600' : 'text-zinc-700'}`}>
                          {trx.type === 'CREDIT' ? '+' : '-'}{formatRupiah(trx.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: BANK ACCOUNT & HELPERS (1/3 width) */}
          <div className="space-y-6">

            {/* LINKED BANK CARD */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-zinc-900 text-sm">{t.bankCard.title}</h4>
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                </div>

                {linkedBank ? (
                  <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-xl p-4 border border-zinc-200 relative overflow-hidden my-2">
                    <div className="absolute top-2 right-2 opacity-5">
                      <Building className="w-16 h-16" />
                    </div>
                    <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">REKENING TERHUBUNG</p>
                    <h5 className="font-bold text-emerald-800 text-base">{linkedBank.split(' - ')[0]}</h5>
                    <p className="text-zinc-600 font-mono text-sm tracking-wider mt-1">{linkedBank.split(' - ')[1]}</p>
                    <p className="text-zinc-500 font-medium text-xs mt-2">{linkedBank.split(' - ')[2]}</p>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-zinc-200 bg-zinc-50 rounded-xl my-2">
                    <Building2 className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400 font-medium">{t.bankCard.empty}</p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-11 border-emerald-200 text-emerald-850 hover:bg-emerald-50 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs">
                      <Plus className="w-4 h-4" />
                      {linkedBank ? (locale === 'id' ? 'Ubah Rekening' : 'Edit Bank Account') : t.bankCard.btnLink}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white p-6 rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-serif font-bold text-zinc-900">
                        {locale === 'id' ? 'Tautkan Rekening Bank' : 'Link Bank Account'}
                      </DialogTitle>
                      <DialogDescription className="text-zinc-400 text-xs">
                        {locale === 'id'
                          ? 'Masukkan data rekening bank Anda untuk mempercepat pencairan saldo penjualan.'
                          : 'Provide your bank information to speed up withdrawal processing.'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleLinkBank} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankData" className="text-zinc-700 font-semibold text-xs">Format: Bank - No. Rekening - Nama Pemilik</Label>
                        <Input
                          id="bankData"
                          required
                          value={bankInfo}
                          onChange={e => setBankInfo(e.target.value)}
                          className="h-12 border-zinc-200 bg-zinc-50 focus:bg-white rounded-xl text-sm"
                          placeholder="BCA - 8920128912 - Koperasi Nilam Jaya"
                        />
                      </div>
                      <Button type="submit" className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl mt-2 transition-all">
                        {locale === 'id' ? 'Simpan Rekening' : 'Save Details'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* FINANCIAL SUPPORT CARD */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-2xl p-6 shadow-sm border border-zinc-800 relative overflow-hidden">
              <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-emerald-600/10 rounded-full blur-xl" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm">{t.supportCard.title}</h4>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                {t.supportCard.desc}
              </p>
              <Button variant="outline" className="w-full h-11 border-zinc-800 text-white hover:bg-zinc-850 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                <span>WhatsApp Finance Support</span>
              </Button>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
