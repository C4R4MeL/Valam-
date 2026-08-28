'use client'

import { useState, useEffect } from 'react'
import { formatRupiah } from '@/lib/mock-data'
import { CheckCircle, XCircle, AlertCircle, Search, FileText, ChevronRight, Edit2, ShieldAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export default function AdminCircularProductsPage() {
  const locale = useLocale() as 'id' | 'en'
  const { toast } = useToast()

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Reject Modal State
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)

  // Edit Category Inline State
  const [editingCategoryProduct, setEditingCategoryProduct] = useState<any | null>(null)
  const [newCategory, setNewCategory] = useState('')

  const getAuthHeaders = () => {
    const token = localStorage.getItem('valam_token')
    return {
      'Authorization': `Bearer ${token}`
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/circular-products/admin`, {
        headers: getAuthHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (err) {
      console.error(err)
      toast({
        title: "Gagal memuat antrean review",
        description: "Pastikan Anda masuk sebagai Admin.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleApprove = async (id: string) => {
    if (!confirm(locale === 'id' ? 'Apakah Anda yakin ingin menyetujui produk ini?' : 'Are you sure you want to approve this product?')) return
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/circular-products/${id}/review`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'approve' })
      })

      if (res.ok) {
        toast({
          title: "Produk Disetujui",
          description: "Produk circular telah aktif di etalase Marketplace."
        })
        fetchProducts()
      } else {
        throw new Error('Gagal memproses persetujuan')
      }
    } catch (err: any) {
      toast({
        title: "Gagal",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  const handleOpenReject = (prod: any) => {
    setSelectedProduct(prod)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectionReason.trim()) {
      toast({
        title: "Validasi Gagal",
        description: "Harap masukkan alasan penolakan.",
        variant: "destructive"
      })
      return
    }

    setSubmittingReview(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/circular-products/${selectedProduct.id}/review`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'reject', rejectionReason })
      })

      if (res.ok) {
        toast({
          title: "Produk Ditolak",
          description: "Produk dikembalikan ke supplier beserta alasan penolakan."
        })
        setShowRejectModal(false)
        setSelectedProduct(null)
        fetchProducts()
      } else {
        throw new Error('Gagal menolak produk')
      }
    } catch (err: any) {
      toast({
        title: "Gagal",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleUpdateCategory = async (id: string, cat: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/circular-products/${id}/admin-category`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category: cat })
      })

      if (res.ok) {
        toast({
          title: "Kategori Berhasil Diedit",
          description: "Kategori circular product telah diperbarui."
        })
        setEditingCategoryProduct(null)
        fetchProducts()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Calculate metrics
  const totalCount = products.length
  const pendingCount = products.filter(p => p.status === 'PENDING').length
  const approvedCount = products.filter(p => p.status === 'APPROVED').length
  const rejectedCount = products.filter(p => p.status === 'REJECTED').length

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.supplier?.profile?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const resolveProductImage = (imagePath?: string) => {
    if (!imagePath) return '/images/premium_oil_dark.png';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    if (imagePath.startsWith('/uploads/')) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
      const origin = API_URL.replace(/\/api$/, '');
      return `${origin}${imagePath}`;
    }
    return imagePath;
  }

  return (
    <div className="min-h-screen bg-emerald-950 flex flex-col lg:flex-row text-zinc-150">
      
      {/* Sidebar Layout component */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 bg-zinc-50 text-zinc-800 p-8 overflow-y-auto h-screen animate-in fade-in duration-500">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-250 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-serif text-emerald-950">Circular Product Validation</h1>
            <p className="text-zinc-500 text-sm mt-1">Review and approve processed waste products submitted by suppliers.</p>
          </div>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Circular Products</p>
            <p className="text-2xl font-bold text-emerald-950 mt-1">{totalCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm border-l-4 border-l-amber-500">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm border-l-4 border-l-emerald-600">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Approved Products</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{approvedCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm border-l-4 border-l-rose-500">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Rejected Products</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{rejectedCount}</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 flex justify-between items-center gap-4">
          <div className="flex items-center bg-white border border-zinc-200 rounded-2xl px-4 py-3 shadow-sm w-full max-w-md">
            <Search className="w-5 h-5 text-zinc-400 mr-2.5" />
            <input 
              type="text" 
              placeholder="Search products or suppliers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-zinc-800 placeholder-zinc-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <div className="w-9 h-9 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-zinc-500">Memuat data verifikasi...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-16 text-center">
              <AlertCircle className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 font-medium text-sm">Tidak ada produk dalam antrean.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/70 border-b border-zinc-200 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Product Details</th>
                    <th className="py-4 px-6">Supplier</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Price & Stock</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm text-zinc-800 font-sans">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="py-4.5 px-6 max-w-[280px]">
                        <div className="flex gap-3 items-start">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 relative border border-zinc-200 shrink-0">
                            <img src={resolveProductImage(prod.image)} alt={prod.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-semibold text-emerald-950 font-serif leading-tight">{prod.name}</p>
                            <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{prod.description}</p>
                            {prod.benefit && (
                              <p className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 mt-1.5 w-fit font-medium">
                                Manfaat: {prod.benefit}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4.5 px-6">
                        <p className="font-medium text-zinc-900">{prod.supplier?.profile?.company_name || 'N/A'}</p>
                        <p className="text-zinc-400 text-xs mt-0.5">{prod.supplier?.profile?.address || 'Aceh, Indonesia'}</p>
                      </td>
                      <td className="py-4.5 px-6">
                        {editingCategoryProduct?.id === prod.id ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              className="rounded-lg border border-zinc-300 px-2 py-1 text-xs focus:outline-none"
                            >
                              <option value="Organic Compost">Organic Compost</option>
                              <option value="Biochar">Biochar</option>
                              <option value="Patchouli Hydrosol">Patchouli Hydrosol</option>
                            </select>
                            <Button 
                              size="sm"
                              className="bg-emerald-750 text-white text-xs px-2 py-1 rounded border-none"
                              onClick={() => handleUpdateCategory(prod.id, newCategory)}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="bg-zinc-100 text-zinc-800 text-xs px-2.5 py-1 rounded-md font-medium border border-zinc-200">
                              {prod.category}
                            </span>
                            <button
                              onClick={() => {
                                setEditingCategoryProduct(prod)
                                setNewCategory(prod.category)
                              }}
                              className="w-6 h-6 hover:bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400 hover:text-emerald-700 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-4.5 px-6">
                        <p className="font-semibold text-emerald-950">{formatRupiah(prod.price)}</p>
                        <p className="text-zinc-400 text-xs mt-0.5">Stok: {prod.stock} {prod.unit}</p>
                      </td>
                      <td className="py-4.5 px-6">
                        {prod.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-250">
                            Approved
                          </span>
                        )}
                        {prod.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-250 animate-pulse">
                            Pending Review
                          </span>
                        )}
                        {prod.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-rose-250">
                            Rejected
                          </span>
                        )}
                        {prod.status === 'DRAFT' && (
                          <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-500 px-2.5 py-0.5 rounded-full text-xs font-bold border border-zinc-250">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="py-4.5 px-6 text-right whitespace-nowrap space-x-1">
                        {prod.status === 'PENDING' ? (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-1.5 px-3 rounded-lg border-none"
                              onClick={() => handleApprove(prod.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-zinc-250 text-rose-600 hover:bg-rose-50 font-bold text-xs py-1.5 px-3 rounded-lg"
                              onClick={() => handleOpenReject(prod)}
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Reject Modal dialog */}
      {showRejectModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md border border-zinc-200 overflow-hidden shadow-2xl relative text-zinc-800">
            
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="text-lg font-bold font-serif text-emerald-950 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Reject Product Listing
              </h3>
              <button 
                onClick={() => setShowRejectModal(false)}
                className="w-8 h-8 rounded-full hover:bg-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-650 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Tolak produk <span className="font-semibold text-zinc-800">{selectedProduct.name}</span>. 
                Masukkan alasan penolakan agar supplier dapat memperbaiki detail produk.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="rejection-reason" className="text-zinc-700 font-bold text-xs">Alasan Penolakan</Label>
                <textarea 
                  id="rejection-reason"
                  rows={4}
                  required
                  value={rejectionReason} 
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Deskripsi produk kurang detail atau foto tidak sesuai..."
                  className="w-full rounded-xl border border-zinc-300 p-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowRejectModal(false)}
                  className="border-zinc-250 text-zinc-650 rounded-xl"
                  disabled={submittingReview}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl border-none shadow-lg shadow-rose-650/15 px-6"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Submitting...' : 'Reject Product'}
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}
