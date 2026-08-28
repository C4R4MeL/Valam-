'use client'

import React, { useState, useEffect } from 'react'
import { X, ShoppingCart, Leaf, Plus, Minus, Info, BadgeCheck, Droplets, Check } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useCart } from '@/components/providers/CartProvider'
import { formatRupiah } from '@/lib/mock-data'
import { validateOrderQuantity } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function CircularOrderModal() {
  const locale = useLocale()
  const isId = locale === 'id'
  const { addToCart } = useCart()
  
  const [isOpen, setIsOpen] = useState(false)
  const [sumberBatchId, setSumberBatchId] = useState<string | null>(null)
  
  // States for Multi-Product Selection (Detail Batch)
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<Record<string, { checked: boolean, qty: number, error: string }>>({})

  // States for Single-Product Selection (Catalog)
  const [singleProduct, setSingleProduct] = useState<any>(null)
  const [singleQty, setSingleQty] = useState(1)
  const [singleError, setSingleError] = useState('')

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // Expose global trigger
    ;(window as any).openCircularOrderModal = async (p: any, batchId: string | null = null) => {
      setSumberBatchId(batchId)
      
      if (batchId) {
        // Multi-product selection mode (Derivative products from database)
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
          const res = await fetch(`${API_URL}/circular-products`)
          const json = await res.json()
          const products = (Array.isArray(json) ? json : [])
            .filter((cp: any) => cp.status === 'APPROVED')
            .map((cp: any) => ({
              id: cp.id,
              nama: cp.name,
              harga_per_unit: cp.price,
              stok_tersedia: cp.stock,
              min_order: 1,
              unit: cp.unit || 'Kg',
              sumber_batch_id: batchId
            }))

          setAvailableProducts(products)
          const initialSelected: Record<string, { checked: boolean, qty: number, error: string }> = {}
          products.forEach(prod => {
            initialSelected[prod.id] = {
              checked: false,
              qty: prod.min_order || 1,
              error: ''
            }
          })
          setSelectedItems(initialSelected)
          setSingleProduct(null)
        } catch (e) {
          console.error("Failed to load circular products for derivative modal", e)
        }
      } else {
        // Single product mode (Catalog)
        setSingleProduct(p)
        setSingleQty(p.min_order || 1)
        setSingleError('')
        setAvailableProducts([])
      }
      
      setIsOpen(true)
    }
    
    return () => {
      delete (window as any).openCircularOrderModal
    }
  }, [])

  if (!isOpen) return null

  // Handler for single product quantity change
  const handleSingleQtyChange = (val: number) => {
    if (!singleProduct) return
    const minOrder = singleProduct.min_order || 1
    const maxStock = singleProduct.stok_tersedia || 9999
    
    setSingleQty(val)
    const validation = validateOrderQuantity(val, minOrder, maxStock, singleProduct.unit || 'Unit')
    setSingleError(validation.errorMsg)
  }

  // Handler for multi-product checkbox toggle
  const handleToggleItem = (prodId: string) => {
    setSelectedItems(prev => {
      const current = prev[prodId]
      return {
        ...prev,
        [prodId]: {
          ...current,
          checked: !current.checked
        }
      }
    })
  }

  // Handler for multi-product quantity stepper
  const handleMultiQtyChange = (prodId: string, val: number, prod: any) => {
    const minOrder = prod.min_order || 1
    const maxStock = prod.stok_tersedia || 9999
    
    const validation = validateOrderQuantity(val, minOrder, maxStock, prod.unit || 'Unit')

    setSelectedItems(prev => ({
      ...prev,
      [prodId]: {
        ...prev[prodId],
        qty: val,
        error: validation.errorMsg
      }
    }))
  }

  const handleAddToCart = async () => {
    if (sumberBatchId) {
      // Add all checked items to cart
      const promises = Object.entries(selectedItems)
        .filter(([_, item]) => item.checked && !item.error)
        .map(([id, item]) => {
          const prod = availableProducts.find(p => p.id === id)
          return addToCart(id, item.qty, 'circular', sumberBatchId)
        })

      if (promises.length > 0) {
        await Promise.all(promises)
        setIsOpen(false)
      }
    } else if (singleProduct) {
      if (singleQty < (singleProduct.min_order || 1) || singleQty > (singleProduct.stok_tersedia || 9999)) return
      const success = await addToCart(singleProduct.id, singleQty, 'circular', null)
      if (success) {
        setIsOpen(false)
      }
    }
  }

  // Calculate Subtotals
  let totalAmount = 0
  let isSubmitDisabled = true

  if (sumberBatchId) {
    Object.entries(selectedItems).forEach(([id, item]) => {
      if (item.checked) {
        const prod = availableProducts.find(p => p.id === id)
        const price = prod?.harga_per_unit || 0
        totalAmount += price * item.qty
        if (!item.error) {
          isSubmitDisabled = false
        }
      }
    })
  } else if (singleProduct) {
    totalAmount = (singleProduct.harga_per_unit || 0) * singleQty
    isSubmitDisabled = !!singleError || singleQty < (singleProduct.min_order || 1)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-xs p-0 md:p-4">
      <motion.div 
        initial={isMobile ? { y: '100%', opacity: 1 } : { y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={isMobile ? { y: '100%', opacity: 1 } : { y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-white rounded-t-[2rem] md:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col border border-zinc-200/50"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 shrink-0">
          <h3 className="font-bold text-[#1A4D2E] flex items-center gap-2">
            <Leaf className="w-5 h-5" />
            {sumberBatchId 
              ? (isId ? `Pesan Sampingan Batch ${sumberBatchId}` : `Order Side-Products Batch ${sumberBatchId}`)
              : (isId ? 'Pesan Produk Turunan' : 'Order Derivative Product')
            }
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-700 bg-white shadow-sm p-1.5 rounded-full border border-zinc-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {sumberBatchId ? (
            /* MULTI-PRODUCT SELECTION MODE */
            <div className="space-y-4">
              <p className="text-xs text-zinc-500 font-medium">
                {isId 
                  ? 'Pilih produk sampingan sirkular hasil olahan dari batch nilam ini:' 
                  : 'Select secondary circular side-products processed from this patchouli batch:'}
              </p>
              
              <div className="space-y-3">
                {availableProducts.map(prod => {
                  const state = selectedItems[prod.id] || { checked: false, qty: prod.min_order || 1, error: '' }
                  
                  return (
                    <div 
                      key={prod.id} 
                      className={`border rounded-2xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        state.checked 
                          ? 'border-[#B69A1D] bg-valam-gold-50/20 shadow-xs' 
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex gap-3 items-start flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleItem(prod.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            state.checked 
                              ? 'bg-[#B69A1D] border-[#B69A1D] text-white' 
                              : 'border-zinc-350 hover:border-zinc-400 bg-white'
                          }`}
                        >
                          {state.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-950 text-sm leading-snug line-clamp-1">{prod.nama}</p>
                          <p className="text-[11px] text-zinc-500 font-medium mt-0.5">{prod.mitra_pengolah_nama}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-black text-[#1A4D2E]">{formatRupiah(prod.harga_per_unit)}/{prod.unit}</span>
                            <span className="text-[10px] text-zinc-400 font-bold">(Stok: {prod.stok_tersedia} {prod.unit})</span>
                          </div>
                        </div>
                      </div>

                      {state.checked && (
                        <div className="flex flex-col items-end shrink-0 gap-1.5">
                          <div className="flex items-center bg-white border border-zinc-200 rounded-lg p-0.5 shadow-sm">
                            <button 
                              onClick={() => handleMultiQtyChange(prod.id, state.qty - 1, prod)}
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-50 text-zinc-500"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input 
                              type="text"
                              value={state.qty}
                              onChange={(e) => {
                                const v = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0
                                handleMultiQtyChange(prod.id, v, prod)
                              }}
                              className="w-10 text-center font-bold text-zinc-900 border-none outline-none focus:ring-0 text-xs p-0"
                            />
                            <button 
                              onClick={() => handleMultiQtyChange(prod.id, state.qty + 1, prod)}
                              className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-50 text-zinc-500"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {state.error && (
                            <span className="text-[9px] text-red-500 font-bold">{state.error}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* SINGLE-PRODUCT MODE (Catalog) */
            singleProduct && (
              <div className="space-y-5">
                {/* Product Quick Info */}
                <div className="flex gap-3 bg-zinc-50 border border-zinc-100 p-4 rounded-2xl items-center">
                  <div className="w-12 h-12 bg-white rounded-xl border border-zinc-200 flex items-center justify-center shrink-0">
                    <Droplets className="w-6 h-6 text-[#1A4D2E]" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 leading-snug line-clamp-1">{singleProduct.nama}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-zinc-500 font-bold">{singleProduct.mitra_pengolah_nama}</span>
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < singleProduct.sustainability_score ? 'text-[#B69A1D]' : 'text-zinc-200'}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Qty */}
                <div className="bg-[#B69A1D]/5 rounded-2xl p-4 border border-[#B69A1D]/15">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-[#B69A1D] uppercase tracking-wider">
                      {isId ? 'Jumlah Pesanan' : 'Order Quantity'}
                    </label>
                    <span className="text-xs font-semibold text-zinc-500">
                      Stok: {singleProduct.stok_tersedia} {singleProduct.unit}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-zinc-200 rounded-xl p-1 shadow-sm shrink-0">
                      <button 
                        onClick={() => handleSingleQtyChange(singleQty - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-50 text-zinc-500 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="w-16 flex items-center justify-center">
                        <input 
                          type="text" 
                          value={singleQty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0
                            handleSingleQtyChange(val)
                          }}
                          className="w-full text-center font-bold text-zinc-900 border-none outline-none focus:ring-0 p-0 text-sm"
                        />
                      </div>
                      <button 
                        onClick={() => handleSingleQtyChange(singleQty + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-50 text-zinc-500 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="font-bold text-zinc-400 text-sm">{singleProduct.unit}</div>
                  </div>
                  
                  {singleError && (
                    <div className="flex items-start gap-1.5 mt-2.5 text-red-600 text-xs font-semibold">
                      <Info className="w-4 h-4 shrink-0" />
                      <p>{singleError}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* Subtotal & Action buttons */}
          <div className="flex justify-between items-center py-2 border-t border-zinc-100 pt-4">
            <span className="text-zinc-500 font-medium text-sm">Subtotal</span>
            <span className="text-2xl font-black text-[#1A4D2E]">{formatRupiah(totalAmount)}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => setIsOpen(false)}
              className="w-1/3 py-3 rounded-xl border-2 border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-50 hover:border-zinc-300 transition-all text-sm"
            >
              {isId ? 'Batal' : 'Cancel'}
            </button>
            <button 
              onClick={handleAddToCart}
              disabled={isSubmitDisabled}
              className="w-2/3 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#B69A1D] hover:bg-[#A38618] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none text-white font-bold transition-all text-sm shadow-lg shadow-[#B69A1D]/20"
            >
              <ShoppingCart className="w-4 h-4" />
              {isId ? 'Tambah ke Keranjang Sirkular' : 'Add to Circular Cart'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
