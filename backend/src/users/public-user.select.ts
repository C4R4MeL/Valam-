import type { Prisma } from '@prisma/client';

export const PUBLIC_SUPPLIER_PROFILE_SELECT = {
  id: true,
  user_id: true,
  supplier_subtype: true,
  nama_pic: true,
  nama_koperasi: true,
  kabupaten: true,
  kecamatan: true,
  desa: true,
  whatsapp: true,
  alamat_lengkap: true,
  kapasitas_produksi: true,
  grade_nilam: true,
  status: true,
  verified_at: true,
  website: true,
  tahun_berdiri: true,
  jumlah_anggota: true,
  minimum_order: true,
  postal_code: true,
  area_id: true,
  durasi_produksi: true,
  metode_distilasi: true,
  bahan_baku: true,
} satisfies Prisma.SupplierProfileSelect;

export const PUBLIC_USER_SELECT = {
  id: true,
  profile: {
    select: {
      company_name: true,
      contact_person: true,
      phone: true,
      country: true,
      avatar_url: true,
      address: true,
      postal_code: true,
      area_id: true,
    },
  },
  supplier_profile: { select: PUBLIC_SUPPLIER_PROFILE_SELECT },
} satisfies Prisma.UserSelect;
