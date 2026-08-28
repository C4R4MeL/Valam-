'use client'

import { useState, useEffect } from 'react'
import { formatRupiah } from '@/lib/mock-data'
import { Search, Plus, Pencil, Trash2, X, AlertCircle, CheckCircle, Upload, Leaf, ClipboardList, ShoppingBag, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale } from 'next-intl'
import { useToast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const PRESET_IMAGES = [
  { name: 'Organic Compost', url: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&h=400&fit=crop' },
  { name: 'Biochar', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop' },
  { name: 'Hydrosol', url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=400&fit=crop' }
]

const contentMap = {
  id: {
    header: {
      title: "Circular Products",
      desc: "Kelola hasil olahan limbah penyulingan nilam Anda (kompos, biochar, hydrosol) untuk dipasarkan ke buyer.",
      btnAdd: "+ Tambah Produk Baru"
    },
    table: {
      colName: "Nama Produk",
      colCategory: "Kategori",
      colPrice: "Harga",
      colStock: "Stok",
      colStatus: "Status",
      colAction: "Aksi",
      empty: "Belum ada Circular Product terdaftar. Silakan buat baru."
    },
    form: {
      addTitle: "Tambah Circular Product Baru",
      editTitle: "Edit Circular Product",
      name: "Nama Produk",
      category: "Kategori",
      desc: "Deskripsi",
      benefit: "Manfaat Produk",
      price: "Harga Jual (Rp)",
      stock: "Jumlah Stok",
      unit: "Satuan (e.g. Sack 10 Kg, Jerigen 1 Liter)",
      image: "Foto Produk",
      btnSave: "Simpan Produk",
      btnCancel: "Batal",
      imageNote: "Unggah berkas foto produk atau pilih gambar bawaan:"
    }
  },
  en: {
    header: {
      title: "Circular Products",
      desc: "Manage your processed patchouli distillation waste products (compost, biochar, hydrosol) to list on the marketplace.",
      btnAdd: "+ Add New Product"
    },
    table: {
      colName: "Product Name",
      colCategory: "Category",
      colPrice: "Price",
      colStock: "Stock",
      colStatus: "Status",
      colAction: "Action",
      empty: "No circular products listed yet. Create a new one."
    },
    form: {
      addTitle: "Add New Circular Product",
      editTitle: "Edit Circular Product",
      name: "Product Name",
      category: "Category",
      desc: "Description",
      benefit: "Benefits",
      price: "Selling Price (Rp)",
      stock: "Stock Quantity",
      unit: "Unit (e.g. Sack 10 Kg, Jerrycan 1 Liter)",
      image: "Product Photo",
      btnSave: "Save Product",
      btnCancel: "Cancel",
      imageNote: "Upload product photo file or choose a preset image:"
    }
  }
}

export default function CircularProductsPage() {
  const locale = useLocale() as 'id' | 'en'
  const t = contentMap[locale] || contentMap.id
  const { toast } = useToast()

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Form Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  
  // File Upload State
  const [uploadingImage, setUploadingImage] = useState(false)

  // Form State
  const [form, setForm] = useState({
    name: '',
    category: 'Organic Compost',
    description: '',
    benefit: '',
    price: '',
    stock: '',
    unit: 'Sack (10 Kg)',
    image: ''
  })

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
      const res = await fetch(`${apiUrl}/circular-products/supplier`, {
        headers: getAuthHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (err) {
      console.error(err)
      toast({
        title: "Gagal memuat produk",
        description: "Silakan periksa koneksi jaringan Anda.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleOpenAdd = () => {
    setEditingProduct(null)
    setForm({
      name: '',
      category: 'Organic Compost',
      description: '',
      benefit: '',
      price: '',
      stock: '',
      unit: 'Sack (10 Kg)',
      image: PRESET_IMAGES[0].url
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (prod: any) => {
    setEditingProduct(prod)
    setForm({
      name: prod.name,
      category: prod.category,
      description: prod.description,
      benefit: prod.benefit,
      price: String(prod.price),
      stock: String(prod.stock),
      unit: prod.unit,
      image: prod.image || ''
    })
    setIsModalOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    
    setUploadingImage(true)
    const formData = new FormData()
    formData.append('file', file)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/circular-products/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        // Save relative path
        setForm(prev => ({ ...prev, image: data.imageUrl }))
        toast({
          title: "Foto Berhasil Diunggah",
          description: "Foto produk circular Anda telah disimpan."
        })
      } else {
        throw new Error('Gagal mengunggah foto')
      }
    } catch (err: any) {
      toast({
        title: "Gagal Mengunggah",
        description: err.message || "Pastikan ukuran file di bawah 5MB dan berformat JPG/PNG.",
        variant: "destructive"
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.name || !form.description || !form.benefit || !form.price || !form.stock) {
      toast({
        title: "Validasi Gagal",
        description: "Harap isi seluruh field formulir wajib.",
        variant: "destructive"
      })
      return
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    const method = editingProduct ? 'PATCH' : 'POST'
    const url = editingProduct 
      ? `${apiUrl}/circular-products/${editingProduct.id}` 
      : `${apiUrl}/circular-products`

    try {
      const res = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        toast({
          title: editingProduct ? "Produk Berhasil Diupdate" : "Produk Berhasil Dibuat",
          description: editingProduct 
            ? "Pembaruan data produk circular berhasil disimpan." 
            : "Produk baru tersimpan dengan status DRAFT. Kirim untuk verifikasi lab agar listing di marketplace."
        })
        setIsModalOpen(false)
        fetchProducts()
      } else {
        const errData = await res.json()
        throw new Error(errData.message || 'Gagal menyimpan produk')
      }
    } catch (err: any) {
      toast({
        title: "Gagal Menyimpan",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'id' ? 'Apakah Anda yakin ingin menghapus produk ini?' : 'Are you sure you want to delete this product?')) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/circular-products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (res.ok) {
        toast({
          title: "Produk Berhasil Dihapus",
          description: "Produk circular telah dihapus dari sistem."
        })
        fetchProducts()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendVerification = async (id: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${apiUrl}/circular-products/${id}/submit`, {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (res.ok) {
        toast({
          title: "Berhasil Diajukan",
          description: "Produk circular berhasil diajukan untuk peninjauan admin."
        })
        fetchProducts()
      } else {
        const errData = await res.json()
        throw new Error(errData.message)
      }
    } catch (err: any) {
      toast({
        title: "Gagal Mengajukan",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string, reason?: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Approved
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            Pending Review
          </span>
        )
      case 'REJECTED':
        return (
          <span 
            className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-200 cursor-help relative group"
            title={reason || "Ditolak oleh admin"}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-650 px-3 py-1 rounded-full text-xs font-bold border border-zinc-200">
            Draft
          </span>
        )
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-250 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-950 font-serif flex items-center gap-2">
            <Leaf className="w-8 h-8 text-emerald-600 animate-pulse" />
            {t.header.title}
          </h1>
          <p className="text-zinc-550 text-sm mt-1 max-w-2xl">{t.header.desc}</p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-md shadow-emerald-700/10 rounded-xl px-5 py-3 shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t.header.btnAdd}
        </Button>
      </div>

      {/* Toolbar Search */}
      <div className="flex items-center bg-white border border-zinc-200 rounded-2xl px-4 py-3 shadow-sm max-w-md">
        <Search className="w-5 h-5 text-zinc-400 mr-2.5" />
        <input 
          type="text" 
          placeholder={locale === 'id' ? "Cari nama produk..." : "Search products..."} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-zinc-800 placeholder-zinc-400"
        />
      </div>

      {/* Products Table Grid */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-3">
            <div className="w-9 h-9 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-zinc-500">Memuat data produk...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center">
            <AlertCircle className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 font-medium text-sm">{t.table.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/70 border-b border-zinc-200 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">{t.table.colName}</th>
                  <th className="py-4 px-6">{t.table.colCategory}</th>
                  <th className="py-4 px-6">{t.table.colPrice}</th>
                  <th className="py-4 px-6">{t.table.colStock}</th>
                  <th className="py-4 px-6">{t.table.colStatus}</th>
                  <th className="py-4 px-6 text-right">{t.table.colAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm text-zinc-800 font-sans">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-4.5 px-6 font-semibold flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 relative border border-zinc-200 shrink-0">
                        <img 
                          src={resolveProductImage(prod.image)} 
                          alt={prod.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="truncate max-w-[200px] sm:max-w-none">
                        <p className="text-zinc-900 leading-tight font-serif">{prod.name}</p>
                        <p className="text-zinc-400 text-xs mt-1 font-mono">{prod.unit}</p>
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      <span className="bg-zinc-100 text-zinc-850 text-xs px-2.5 py-1 rounded-md font-medium border border-zinc-250">
                        {prod.category}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 font-semibold text-emerald-950">
                      {formatRupiah(prod.price)}
                    </td>
                    <td className="py-4.5 px-6 font-mono font-medium text-zinc-650">
                      {prod.stock}
                    </td>
                    <td className="py-4.5 px-6">
                      {getStatusBadge(prod.status, prod.rejection_reason)}
                      {prod.status === 'REJECTED' && prod.rejection_reason && (
                        <p className="text-[10px] text-rose-600 mt-1 max-w-[180px] bg-rose-50 p-1.5 rounded-lg border border-rose-100 italic leading-snug">
                          Alasan: {prod.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="py-4.5 px-6 text-right space-x-1 shrink-0 whitespace-nowrap">
                      {(prod.status === 'DRAFT' || prod.status === 'REJECTED') && (
                        <Button 
                          size="sm"
                          onClick={() => handleSendVerification(prod.id)}
                          className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-1.5 rounded-lg border-none"
                        >
                          Ajukan Review
                        </Button>
                      )}
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(prod)}
                        className="border-zinc-200 text-zinc-700 hover:bg-zinc-100 rounded-lg"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(prod.id)}
                        className="border-zinc-200 text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-zinc-200 overflow-hidden shadow-2xl relative">
            
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="text-xl font-bold font-serif text-emerald-950">
                {editingProduct ? t.form.editTitle : t.form.addTitle}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-650 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prod-name" className="text-zinc-700 font-bold text-xs">{t.form.name}</Label>
                  <Input 
                    id="prod-name" 
                    value={form.name} 
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Pupuk Kompos Nilam Jaya"
                    className="rounded-xl border-zinc-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prod-category" className="text-zinc-700 font-bold text-xs">{t.form.category}</Label>
                  <select 
                    id="prod-category"
                    value={form.category} 
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="Organic Compost">Organic Compost</option>
                    <option value="Biochar">Biochar</option>
                    <option value="Patchouli Hydrosol">Patchouli Hydrosol</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-desc" className="text-zinc-700 font-bold text-xs">{t.form.desc}</Label>
                <textarea 
                  id="prod-desc"
                  rows={3}
                  value={form.description} 
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Jelaskan detail pengolahan produk hasil limbah distilasi nilam Anda..."
                  className="w-full rounded-xl border border-zinc-300 p-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-benefit" className="text-zinc-700 font-bold text-xs">{t.form.benefit}</Label>
                <textarea 
                  id="prod-benefit"
                  rows={2}
                  value={form.benefit} 
                  onChange={e => setForm(prev => ({ ...prev, benefit: e.target.value }))}
                  placeholder="e.g. Menyuburkan mikroba tanah, mengikat air, menyembuhkan iritasi..."
                  className="w-full rounded-xl border border-zinc-300 p-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prod-price" className="text-zinc-700 font-bold text-xs">{t.form.price}</Label>
                  <Input 
                    id="prod-price" 
                    type="number"
                    value={form.price} 
                    onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g. 15000"
                    className="rounded-xl border-zinc-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prod-stock" className="text-zinc-700 font-bold text-xs">{t.form.stock}</Label>
                  <Input 
                    id="prod-stock" 
                    type="number"
                    value={form.stock} 
                    onChange={e => setForm(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder="e.g. 100"
                    className="rounded-xl border-zinc-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prod-unit" className="text-zinc-700 font-bold text-xs">{t.form.unit}</Label>
                  <Input 
                    id="prod-unit" 
                    value={form.unit} 
                    onChange={e => setForm(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="e.g. Sack (10 Kg)"
                    className="rounded-xl border-zinc-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="space-y-3 p-4 bg-zinc-50 border border-zinc-150 rounded-2xl">
                <Label className="text-zinc-700 font-bold text-xs block">{t.form.image}</Label>
                <p className="text-zinc-400 text-[10px] leading-snug">{t.form.imageNote}</p>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-2">
                  {form.image && (
                    <div className="w-20 h-20 rounded-xl border border-zinc-200 overflow-hidden relative bg-white shrink-0">
                      <img src={resolveProductImage(form.image)} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-2 w-full">
                    {/* File Upload Input */}
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        id="image-upload-input"
                        className="hidden"
                      />
                      <Label 
                        htmlFor="image-upload-input" 
                        className={`inline-flex items-center cursor-pointer justify-center px-4 py-2 border border-zinc-250 text-xs font-bold rounded-xl bg-white text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm ${uploadingImage ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        <Upload className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                        {uploadingImage ? 'Uploading...' : 'Pilih Berkas Foto'}
                      </Label>
                    </div>

                    {/* Preset selections */}
                    <div className="flex flex-wrap gap-2 pt-1.5">
                      {PRESET_IMAGES.map((preset) => (
                        <button 
                          key={preset.name}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, image: preset.url }))}
                          className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-all ${
                            form.image === preset.url 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                              : 'bg-white text-zinc-550 border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          {preset.name} Preset
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 bg-zinc-50/50 p-6 -mx-6 -mb-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-zinc-250 text-zinc-650 rounded-xl"
                >
                  {t.form.btnCancel}
                </Button>
                <Button 
                  type="submit" 
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl border-none shadow-lg shadow-emerald-700/15 px-6"
                >
                  {t.form.btnSave}
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}
