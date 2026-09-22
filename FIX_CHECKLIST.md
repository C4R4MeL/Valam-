# ✅ Landing Page Harga - Fix Checklist

## 📋 Perubahan yang Sudah Dilakukan:

### 1. ✅ Frontend - Hero Section
**File:** `frontend/src/app/[locale]/page.tsx`
- ✅ Import: `getLatestMarketPrices`, `mergeMarketPrices`, `formatPrice`
- ✅ State: `const [gradeAPrice, setGradeAPrice]` untuk dynamic price
- ✅ Effect: Fetch Grade A price saat component mount
- ✅ Render: Ubah dari `"Rp 450k"` → `{gradeAPrice}`

### 2. ✅ Frontend - Price Section (Table)
**File:** `frontend/src/components/landing/PriceSection.tsx`
- ✅ Import: `GRADE_SPECS`, `mergeMarketPrices` 
- ✅ State: `const [priceData, setPriceData]` untuk table data
- ✅ Effect: Fetch all market prices (A, B, C) saat mount
- ✅ Render: Tabel menampilkan Grade A (850k), B (780k), C (680k)

### 3. ✅ Database - Migration
**File:** `supabase/migrations/011_update_market_prices.sql`
- ✅ Upsert Grade A, B, C dengan harga yang benar
- ✅ Create history record untuk audit

---

## 🚀 Steps untuk Apply Changes:

### Step 1: Update Supabase Prices
```bash
# Option A: Jalankan SQL migration
supabase migration up

# Option B: Manual update via Supabase Dashboard
# Buka: https://app.supabase.com
# → Leaderboards → SQL Editor
# → Jalankan query dari: supabase/migrations/011_update_market_prices.sql
```

### Step 2: Update Environment Variables (jika needed)
```bash
# Pastikan .env atau .env.local di frontend punya:
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001/api
# atau URL Supabase yang benar
```

### Step 3: Rebuild Frontend
```bash
cd frontend

# Option A: Development mode
npm run dev

# Option B: Production build
npm run build
npm run start
```

### Step 4: Clear Browser Cache
```bash
# Close all browser tabs dengan valam.dev atau localhost
# Open DevTools (F12) → Application → Clear Site Data
# Atau: Ctrl+Shift+Delete (Chrome)
```

### Step 5: Verify Changes
1. Buka landing page: `http://localhost:3000` (atau valam.dev)
2. Check hero section — seharusnya tapil: **"Rp 850k"** atau **"IDR 850k"** (bukan 450k)
3. Scroll down ke Market Price section — seharusnya tampil:
   - Grade A ⭐ | ≥32% PA | Rp 850.000 | Europe, Japan
   - Grade B | 28-31% PA | Rp 780.000 | Middle East  
   - Grade C | <28% PA | Rp 680.000 | Domestic

---

## 🔍 Troubleshooting

### Masalah: Harga masih 450k
**Solusi:**
1. Pastikan Supabase sudah update (run migration)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart development server (Ctrl+C → npm run dev)
4. Check console (F12) untuk error messages

### Masalah: Error "getLatestMarketPrices is not a function"
**Solusi:**
1. Pastikan `npm install` di frontend sudah run
2. Pastikan import path benar: `@/lib/valam-insights/insights-api`
3. Restart TypeScript server di editor

### Masalah: Fallback price tampil (850k) tapi bukan dari Supabase
**Solusi:**
1. Check Supabase RLS policies — pastikan public bisa read `insights_market_prices`
2. Cek network tab (F12) — lihat apakah API call ke Supabase gagal
3. Manual insert data ke Supabase jika table kosong

---

## 📊 Expected Database State

```
Table: insights_market_prices

| id | grade | price_per_kg | currency | updated_at |
|----|-------|--------------|----------|-----------|
| 1  | A     | 850000       | IDR      | 2026-09-22|
| 2  | B     | 780000       | IDR      | 2026-09-22|
| 3  | C     | 680000       | IDR      | 2026-09-22|
```

---

## 📝 Files Modified:

✅ `frontend/src/app/[locale]/page.tsx` — Hero section dynamic price
✅ `frontend/src/components/landing/PriceSection.tsx` — Price table from API
✅ `supabase/migrations/011_update_market_prices.sql` — Database update
✅ `scripts/update_market_prices.sh` — Helper script (optional)
✅ `docs/GRADING_SYSTEM.md` — Documentation

---

**Status:** Ready for testing ✨
**Next:** Run steps di atas untuk apply changes
