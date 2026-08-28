import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatRupiah = (number: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number)
}

// B2B Domain Utilities
export const getPatchouliTier = (paPercentage: number): "Premium" | "Standard" | "Basic" => {
  if (paPercentage >= 34) return "Premium";
  if (paPercentage >= 30) return "Standard";
  return "Basic";
};

export const getTierColorClass = (tier: "Premium" | "Standard" | "Basic") => {
  if (tier === 'Premium') return 'bg-valam-gold/20 text-[#855F0D] border-valam-gold/40';
  if (tier === 'Standard') return 'bg-[#F4F4F5] text-[#27272A] border-[#E4E4E7]';
  return 'bg-[#FAF6F0] text-[#5C3D1E] border-[#F0E5D8]';
};

export const isGcmsVerified = (status: string): boolean => {
  return status === "VERIFIED" || status === "APPROVED";
};

export const validateOrderQuantity = (qty: number, moq: number, available: number, unit: string = 'kg') => {
  if (qty < moq) {
    return { valid: false, messageId: 'minOrder', errorMsg: `Minimum pemesanan ${moq} ${unit}` };
  }
  if (qty > available) {
    return { valid: false, messageId: 'maxStock', errorMsg: `Stok tersisa hanya ${available} ${unit}` };
  }
  return { valid: true, messageId: '', errorMsg: '' };
};
