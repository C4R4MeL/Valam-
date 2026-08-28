'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAuthContext } from './AuthProvider'

interface CartContextType {
  patchouliItems: any[]
  circularItems: any[]
  loading: boolean
  fetchCart: () => Promise<void>
  addToCart: (productId: string, quantityKg: number, itemType?: 'patchouli' | 'circular', sumber_batch_id?: string | null) => Promise<boolean>
  updateQuantity: (itemId: string, newQuantity: number) => Promise<boolean>
  removeItem: (itemId: string, silent?: boolean) => Promise<boolean>
  clearCart: (isCircular?: boolean) => Promise<void>
  totalItems: number
}

const CartContext = createContext<CartContextType | null>(null)

export function useCart(): CartContextType {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within <CartProvider>')
  }
  return ctx
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [patchouliItems, setPatchouliItems] = useState<any[]>([])
  const [circularItems, setCircularItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { token, isAuthenticated } = useAuthContext()
  const { toast } = useToast()

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setPatchouliItems([])
      setCircularItems([])
      return
    }

    setLoading(true)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${API_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        const items = data.items || []
        const patchouli = items.filter((item: any) => !item.is_circular)
        const circular = items.filter((item: any) => item.is_circular)
        setPatchouliItems(patchouli)
        setCircularItems(circular)
      } else {
        setPatchouliItems([])
        setCircularItems([])
      }
    } catch (error) {
      console.error(error)
      setPatchouliItems([])
      setCircularItems([])
    } finally {
      setLoading(false)
    }
  }, [token, isAuthenticated])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const addToCart = async (productId: string, quantityKg: number, itemType: 'patchouli' | 'circular' = 'patchouli', sumber_batch_id?: string | null): Promise<boolean> => {
    const locale = typeof window !== 'undefined' && window.location.pathname.startsWith('/en') ? 'en' : 'id'

    if (!token) {
      toast({
        title: 'Harap Masuk Terlebih Dahulu',
        description: 'Anda harus masuk akun buyer untuk memasukkan produk ke keranjang.',
        variant: 'destructive'
      })
      return false
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const payload: any = {
        productId: productId,
        product_id: productId,
        quantity_kg: quantityKg,
        quantity: quantityKg,
        sumber_batch_id: sumber_batch_id || undefined
      }

      if (itemType === 'circular') {
        payload.circular_product_id = productId
        payload.circularProductId = productId
      }

      const res = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        if (itemType === 'circular') {
          toast({
            title: 'Ditambahkan ke Keranjang Sirkular',
            description: 'Produk sirkular telah berhasil dimasukkan ke keranjang belanja.',
            action: (
              <div className="flex gap-2 items-center mt-2">
                <button 
                  onClick={() => {}} 
                  className="bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 px-3 py-1 rounded-md text-xs font-semibold"
                >
                  Lanjut Belanja
                </button>
                <button 
                  onClick={() => window.location.href = `/${locale}/cart`} 
                  className="bg-[#B69A1D] hover:bg-[#A38618] text-white px-3 py-1 rounded-md text-xs font-semibold"
                >
                  Lihat Keranjang
                </button>
              </div>
            )
          })
        } else {
          toast({
            title: 'Berhasil ditambahkan',
            description: 'Batch telah berhasil dimasukkan ke keranjang belanja domestik.'
          })
        }
        await fetchCart()
        return true
      } else {
        const err = await res.json()
        toast({
          title: 'Gagal menambahkan',
          description: err.message || 'Terjadi kesalahan saat menambahkan ke keranjang.',
          variant: 'destructive'
        })
        return false
      }
    } catch (error) {
      console.error(error)
      toast({
        title: 'Gagal menambahkan',
        description: 'Koneksi ke server terputus.',
        variant: 'destructive'
      })
      return false
    }
  }

  const updateQuantity = async (itemId: string, newQuantity: number): Promise<boolean> => {
    if (!token) return false

    if (newQuantity <= 0) {
      return removeItem(itemId)
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${API_URL}/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity_kg: newQuantity })
      })

      if (res.ok) {
        await fetchCart()
        return true
      } else {
        const err = await res.json()
        toast({
          title: 'Gagal memperbarui kuantitas',
          description: err.message || 'Mencapai batas minimum/maksimum stok.',
          variant: 'destructive'
        })
        return false
      }
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const removeItem = async (itemId: string, silent = false): Promise<boolean> => {
    if (!token) {
      setPatchouliItems(prev => prev.filter(item => item.id !== itemId))
      setCircularItems(prev => prev.filter(item => item.id !== itemId))
      return true
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'
    try {
      const res = await fetch(`${API_URL}/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok || res.status === 404) {
        if (!silent && res.ok) {
          toast({
            title: 'Item dihapus',
            description: 'Item berhasil dihapus dari keranjang.'
          })
        }
        await fetchCart()
        return true
      } else {
        if (!silent) {
          toast({
            title: 'Gagal menghapus',
            description: 'Gagal menghapus item dari keranjang.',
            variant: 'destructive'
          })
        }
        return false
      }
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const clearCart = async (isCircular?: boolean) => {
    if (isCircular !== undefined) {
      if (isCircular) {
        setCircularItems([])
      } else {
        setPatchouliItems([])
      }
    } else {
      setPatchouliItems([])
      setCircularItems([])
    }
    await fetchCart()
  }

  const totalItems = patchouliItems.length + circularItems.length

  return (
    <CartContext.Provider value={{ patchouliItems, circularItems, loading, fetchCart, addToCart, updateQuantity, removeItem, clearCart, totalItems }}>
      {children}
    </CartContext.Provider>
  )
}
