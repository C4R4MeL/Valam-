'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { FileText, Clock, CheckCircle2, XCircle, Send, Inbox } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DashboardHeader } from '@/components/layout/DashboardHeader'

export default function SupplierRfqListPage() {
  const [rfqs, setRfqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseForm, setResponseForm] = useState({
    proposed_price_per_kg: 0,
    proposed_volume_kg: 0,
    message: '',
    action: 'ACCEPT' as 'ACCEPT' | 'COUNTER' | 'REJECT'
  })

  const fetchRfqs = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const token = localStorage.getItem('valam_token')
      const res = await fetch(`${API_URL}/rfq/supplier`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Gagal memuat RFQ masuk')
      const json = await res.json()
      setRfqs(json.data || [])
    } catch (err: any) {
      console.warn("Backend offline or error fetching RFQs:", err)
      setRfqs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    localStorage.removeItem('valam_rfqs')
    fetchRfqs()
  }, [])

  const handleRespond = async (e: React.FormEvent, rfqId: string) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const token = localStorage.getItem('valam_token')
      const res = await fetch(`${API_URL}/rfq/${rfqId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(responseForm)
      })

      if (!res.ok) throw new Error('Gagal merespons RFQ')
      
      toast({ title: 'Berhasil', description: 'Respons Anda telah dikirim ke Pembeli.' })
      setRespondingTo(null)
      fetchRfqs()
    } catch (err: any) {
      toast({
        title: 'Respons Gagal',
        description: err.message || 'Koneksi ke server gagal.',
        variant: 'destructive'
      })
      setRespondingTo(null)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'SENT': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100"><Clock className="w-3 h-3 mr-1"/> Baru</Badge>
      case 'ACCEPTED': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3 mr-1"/> Disetujui</Badge>
      case 'REJECTED': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1"/> Ditolak</Badge>
      case 'COUNTER_OFFER': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100"><FileText className="w-3 h-3 mr-1"/> Counter Offer</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) return <div className="p-8 text-center text-zinc-600">Loading RFQ Masuk...</div>

  return (
    <div className="w-full flex flex-col">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full min-h-[70vh] pb-12">
        {rfqs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center flex flex-col items-center justify-center">
          <div className="bg-zinc-50 p-4 rounded-full mb-4">
            <Inbox className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-1">Belum Ada Permintaan</h3>
          <p className="text-zinc-500 max-w-sm">Anda belum menerima penawaran (RFQ) masuk dari pembeli mana pun saat ini.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {rfqs.map(rfq => (
            <div key={rfq.id} className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start mb-4 border-b border-zinc-100 pb-4 gap-4 md:gap-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium text-blue-600">{rfq.rfq_number}</span>
                      {getStatusBadge(rfq.status)}
                    </div>
                    <h3 className="font-bold text-zinc-900">{rfq.buyer?.profile?.company_name || 'Pembeli B2B'}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-500">{new Date(rfq.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-zinc-500">Permintaan Volume</p>
                    <p className="font-medium text-lg">{rfq.volume_kg} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Budget Pembeli</p>
                    <p className="font-medium text-lg text-emerald-600">{formatRupiah(rfq.budget_per_kg)}<span className="text-sm text-zinc-400">/kg</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Min. PA%</p>
                    <p className="font-medium">{rfq.min_pa_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Maks. Moisture</p>
                    <p className="font-medium">{rfq.max_moisture}%</p>
                  </div>
                </div>

                {rfq.notes && (
                  <div className="bg-zinc-50 p-4 rounded-xl text-sm text-zinc-700 mb-4 border border-zinc-100">
                    <strong>Pesan dari Pembeli:</strong><br/>
                    {rfq.notes}
                  </div>
                )}

                {rfq.status === 'SENT' && respondingTo !== rfq.id && (
                  <div className="pt-2">
                    <Button 
                      onClick={() => {
                        setRespondingTo(rfq.id)
                        setResponseForm({
                          proposed_price_per_kg: rfq.budget_per_kg,
                          proposed_volume_kg: rfq.volume_kg,
                          message: '',
                          action: 'ACCEPT'
                        })
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                    >
                      Beri Respons
                    </Button>
                  </div>
                )}
                
                {rfq.response && rfq.status !== 'SENT' && (
                  <div className="mt-4 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-900 mb-2">Respons Anda ({rfq.status}):</h4>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                      <div>
                        <p className="text-xs text-blue-700">Volume Disetujui</p>
                        <p className="font-medium text-blue-900">{rfq.response.proposed_volume_kg} kg</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-700">Harga Disetujui</p>
                        <p className="font-medium text-blue-900">{formatRupiah(rfq.response.proposed_price_per_kg)}/kg</p>
                      </div>
                    </div>
                    {rfq.response.message && (
                      <p className="text-sm text-blue-800 italic mt-1">"{rfq.response.message}"</p>
                    )}
                  </div>
                )}
              </div>

              {respondingTo === rfq.id && (
                <div className="bg-zinc-50 p-6 border-t border-zinc-200">
                  <h4 className="font-bold text-zinc-900 mb-4">Form Respons RFQ</h4>
                  <form onSubmit={(e) => handleRespond(e, rfq.id)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Keputusan</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={responseForm.action}
                          onChange={e => {
                            const newAction = e.target.value as 'ACCEPT' | 'COUNTER' | 'REJECT';
                            setResponseForm({
                              ...responseForm,
                              action: newAction,
                              proposed_price_per_kg: newAction === 'ACCEPT' ? rfq.budget_per_kg : responseForm.proposed_price_per_kg,
                              proposed_volume_kg: newAction === 'ACCEPT' ? rfq.volume_kg : responseForm.proposed_volume_kg
                            });
                          }}
                        >
                          <option value="ACCEPT">Terima Penawaran</option>
                          <option value="COUNTER">Counter Offer (Tawar Balik)</option>
                          <option value="REJECT">Tolak</option>
                        </select>
                      </div>
                    </div>

                    {responseForm.action !== 'REJECT' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Volume yang Disanggupi (Kg)</Label>
                          <Input 
                            type="number" required
                            value={responseForm.proposed_volume_kg}
                            onChange={e => setResponseForm({...responseForm, proposed_volume_kg: Number(e.target.value)})}
                            disabled={responseForm.action === 'ACCEPT'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Harga yang Disepakati / Kg</Label>
                          <Input 
                            type="number" required
                            value={responseForm.proposed_price_per_kg}
                            onChange={e => setResponseForm({...responseForm, proposed_price_per_kg: Number(e.target.value)})}
                            disabled={responseForm.action === 'ACCEPT'}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Pesan Balasan</Label>
                      <Textarea 
                        rows={3}
                        placeholder="Contoh: Kami bisa penuhi 50kg dengan harga tersebut. Silakan lanjut transaksi."
                        value={responseForm.message}
                        onChange={e => setResponseForm({...responseForm, message: e.target.value})}
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="ghost" disabled={submitting} onClick={() => setRespondingTo(null)}>Batal</Button>
                      <Button type="submit" disabled={submitting} className="bg-zinc-900 hover:bg-zinc-800 text-white">
                        {submitting ? (
                          <span>Mengirim...</span>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Kirim Respons
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
