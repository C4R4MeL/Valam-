# Biteship Shipping API Integration

Dokumentasi integrasi Biteship API untuk pengiriman domestik di platform VALAM.

## Environment Variables

### Backend (`backend/.env`)

```env
# API key dari dashboard Biteship (https://app.biteship.com)
BITESHIP_API_KEY=biteship_test_xxxxxxxxxxxx

# Base URL Biteship API
BITESHIP_BASE_URL=https://api.biteship.com

# Mode: "sandbox" atau "production"
# - sandbox: fallback ke mock data jika API gagal
# - production: error langsung dilempar ke client (tidak ada mock)
BITESHIP_ENV=sandbox

# Webhook signature header name (dikonfigurasi di dashboard Biteship)
BITESHIP_WEBHOOK_SIGNATURE_KEY=x-biteship-signature

# Webhook secret value (dikonfigurasi di dashboard Biteship)
BITESHIP_WEBHOOK_TOKEN=your_webhook_secret_here
```

> **PENTING**: Ganti `BITESHIP_API_KEY` dengan key sandbox asli dari [dashboard Biteship](https://app.biteship.com). Key `biteship_test_key_dummy` hanya placeholder dan tidak akan bekerja.

---

## Arsitektur Alur Pengiriman Domestik

```
┌──────────┐     1. GET /shipment/rates?orderId=x   ┌──────────┐     2. POST /v1/rates/couriers    ┌──────────┐
│ Frontend │ ───────────────────────────────────────▶│ Backend  │ ──────────────────────────────────▶│ Biteship │
│ Checkout │                                        │ NestJS   │                                    │ API      │
│ Page     │◀─────────────────────────────────────── │ Shipment │ ◀──────────────────────────────────│          │
│          │   { rates with ongkir }                │ Service  │   { pricing[] }                    │          │
└──────┬───┘                                        └──────┬───┘                                    └────┬─────┘
       │                                                   │                                             │
       │ 3. POST /shipment/confirm-ongkir                  │                                             │
       │   { orderId, selectedRateId }                     │                                             │
       │──────────────────────────────────────────────────▶│  4. Upsert Shipment record                  │
       │◀──────────────────────────────────────────────── │     (snapshot alamat + rate)                 │
       │                                                   │                                             │
       │   ... [Buyer bayar via Midtrans] ...              │                                             │
       │                                                   │                                             │
       │ 5. POST /shipment/:id/confirm-pickup              │  6. POST /v1/orders                         │
       │   (Supplier konfirmasi pickup)                    │──────────────────────────────────────────▶  │
       │                                                   │◀──────────────────────────────────────────  │
       │                                                   │  { id, waybill_id, tracking_url }           │
       │                                                   │                                             │
       │                                                   │  7. POST /shipment/webhook/biteship          │
       │                                                   │◀──────────────────────────────────────────  │
       │                                                   │  (status updates: picking_up,                │
       │                                                   │   in_transit, delivered, failed)             │
```

---

## Alur Area Search (Pengisian Alamat Profil)

```
┌──────────┐   GET /shipment/areas/search?q=Takengon   ┌──────────┐   GET /v1/maps/areas?...   ┌──────────┐
│ Frontend │ ──────────────────────────────────────────▶│ Backend  │ ──────────────────────────▶│ Biteship │
│ Profile  │                                           │ Shipment │                             │ Maps API │
│ Page     │◀────────────────────────────────────────── │ Controller│◀────────────────────────── │          │
│          │  [{ id, name, postal_code }]              │          │  { areas[] }               │          │
└──────────┘                                           └──────────┘                             └──────────┘

User memilih area → Frontend simpan area_id + postal_code ke Profile/SupplierProfile
```

---

## API Endpoints

### Shipment

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/shipment/areas/search?q=...` | Bearer | Cari area_id untuk autocomplete alamat (proxy Biteship Maps API) |
| `GET` | `/api/shipment/rates?orderId=...` | Bearer (BUYER) | Dapatkan opsi ongkir dari Biteship + formula B2B |
| `POST` | `/api/shipment/confirm-ongkir` | Bearer (BUYER) | Kunci ongkir pilihan buyer (upsert Shipment) |
| `POST` | `/api/shipment/ekspor` | Bearer (BUYER) | Submit parameter pengiriman ekspor |
| `POST` | `/api/shipment/:id/confirm-pickup` | Bearer (SUPPLIER) | Konfirmasi pickup → buat order di Biteship |
| `POST` | `/api/shipment/:id/confirm-received` | Bearer (BUYER) | Konfirmasi barang diterima |
| `GET` | `/api/shipment/:id/tracking` | Bearer | Status tracking shipment |
| `POST` | `/api/shipment/webhook/biteship` | **Public** (diverifikasi via header) | Webhook dari Biteship |

### Webhook Status Mapping

| Biteship Status | Shipment Status VALAM |
|----------------|-----------------------|
| `picking_up` | `DIKIRIM` |
| `in_transit` | `DALAM_PERJALANAN` |
| `delivered` | `TIBA_DI_TUJUAN` |
| `failed` | `BERMASALAH` |

---

## Setup Webhook URL di Dashboard Biteship

### Untuk Testing Lokal (via ngrok/tunnel)

1. Install ngrok: `npm install -g ngrok` atau download dari [ngrok.com](https://ngrok.com)
2. Jalankan backend: `npm run start:dev` (port 3001)
3. Buat tunnel: `ngrok http 3001`
4. Copy URL tunnel (contoh: `https://abc123.ngrok.io`)
5. Buka [Biteship Dashboard](https://app.biteship.com)
6. Pergi ke **Integrasi → Webhook**
7. Klik **Tambah Webhook**:
   - **URL**: `https://abc123.ngrok.io/api/shipment/webhook/biteship`
   - **Environment**: Testing
   - **Headers Signature Key**: `x-biteship-signature`
   - **Headers Signature Secret**: `valam_biteship_secret` (atau secret pilihan Anda)
8. Klik **Simpan**

### Untuk Production / Deployment

1. Set webhook URL ke: `https://api.valam.my.id/api/shipment/webhook/biteship`
2. Environment: **Live**
3. Pastikan header key & secret sesuai dengan `.env`:
   - `BITESHIP_WEBHOOK_SIGNATURE_KEY=x-biteship-signature`
   - `BITESHIP_WEBHOOK_TOKEN=<secret yang sama dengan dashboard>`
4. Pastikan endpoint bisa diakses publik (HTTPS)
5. Pastikan endpoint selalu return HTTP 200 (supaya Biteship tidak retry)

---

## Model Harga Ongkir

VALAM menggunakan **formula B2B custom** untuk menghitung ongkir yang ditampilkan ke buyer:

```
totalOngkir = baseCost + insurance + packaging

baseCost    = MAX(formulaCustom, biteshipRealRate)   ← Floor Protection
insurance   = totalAmount × 0.2%
packaging   = jumlahDrum × Rp 50.000
```

### Formula Custom (`calculateBaseRate`)

| Kurir | Tarif/kg |
|-------|----------|
| JNE | Rp 2.500/kg |
| SiCepat | Rp 2.200/kg |
| Lainnya | Rp 1.500/kg |

**Multiplier rute:**
- Sumatra → Jawa Barat/Jakarta: ×1.4
- Sumatra → Jawa Tengah/Timur: ×1.6

### Floor Protection

> Base cost VALAM **tidak boleh lebih rendah** dari harga real Biteship. Jika formula custom menghasilkan angka lebih kecil dari rate Biteship, maka harga Biteship yang dipakai sebagai `baseCost`. Ini mencegah VALAM menanggung selisih (nombok).

---

## Webhook Security

Webhook diverifikasi melalui **Header Signature Key-Value Matching**:

1. Saat setup webhook di dashboard Biteship, Anda mengisi:
   - **Headers Signature Key** (nama header, mis. `x-biteship-signature`)
   - **Headers Signature Secret** (value, mis. `valam_secret_123`)

2. Setiap webhook yang masuk, Biteship mengirim header tersebut.

3. Backend VALAM memverifikasi:
   ```
   headers[BITESHIP_WEBHOOK_SIGNATURE_KEY] === BITESHIP_WEBHOOK_TOKEN
   ```

4. Jika tidak cocok → tolak dengan `401 Unauthorized`.

---

## Cara Menguji

### 1. Test Area Search

```bash
curl -X GET "http://localhost:3001/api/shipment/areas/search?q=Takengon" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### 2. Test Get Rates

```bash
# Pastikan Profile buyer & SupplierProfile sudah punya postal_code/area_id
curl -X GET "http://localhost:3001/api/shipment/rates?orderId=<ORDER_ID>" \
  -H "Authorization: Bearer <BUYER_JWT>"
```

### 3. Test Confirm Ongkir

```bash
curl -X POST "http://localhost:3001/api/shipment/confirm-ongkir" \
  -H "Authorization: Bearer <BUYER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "<ORDER_ID>", "selectedRateId": "rate_jne_jtr"}'
```

### 4. Simulasi Webhook Manual

```bash
# Simulasi status update dari Biteship
curl -X POST http://localhost:3001/api/shipment/webhook/biteship \
  -H "Content-Type: application/json" \
  -H "x-biteship-signature: valam_biteship_secret" \
  -d '{
    "event": "order.status",
    "courier": {
      "waybill_id": "VALAM-DOM-XXXXX"
    },
    "status": "in_transit",
    "note": "Paket sedang dalam perjalanan",
    "current_position": "Hub Sorting Jakarta"
  }'
```

### 5. Test Webhook Rejection (Invalid Signature)

```bash
# Harus return 401 Unauthorized
curl -X POST http://localhost:3001/api/shipment/webhook/biteship \
  -H "Content-Type: application/json" \
  -H "x-biteship-signature: wrong_secret" \
  -d '{"status": "delivered"}'
```

---

## Checklist Pindah ke Production

- [ ] Daftar akun Biteship Production: [biteship.com](https://biteship.com)
- [ ] Dapatkan Production API Key dari dashboard
- [ ] Ganti environment variables:
  - `BITESHIP_API_KEY=<production_key>`
  - `BITESHIP_ENV=production`
  - `BITESHIP_WEBHOOK_TOKEN=<new_strong_secret>`
- [ ] Set Webhook URL di Dashboard Biteship (environment: Live):
  - URL: `https://api.valam.my.id/api/shipment/webhook/biteship`
  - Header Key: `x-biteship-signature`
  - Header Secret: `<BITESHIP_WEBHOOK_TOKEN>`
- [ ] Pastikan semua Supplier sudah mengisi `postal_code` dan `area_id` di profil
- [ ] Pastikan semua Buyer sudah mengisi `postal_code` dan `area_id` di profil
- [ ] Test end-to-end: get rates → confirm ongkir → bayar → confirm pickup → tracking
- [ ] Monitor log webhook di dashboard Biteship
- [ ] Setup alerting untuk webhook failures

---

## Database Schema (Field Baru)

### profiles (Buyer)
| Field | Type | Deskripsi |
|-------|------|-----------|
| `postal_code` | String? | Kode pos dari Biteship Maps API |
| `area_id` | String? | Area ID unik Biteship (mis. `IDNP6IDNC148IDND843IDZ12250`) |

### supplier_profiles
| Field | Type | Deskripsi |
|-------|------|-----------|
| `postal_code` | String? | Kode pos dari Biteship Maps API |
| `area_id` | String? | Area ID unik Biteship |

> **Catatan**: `area_id` lebih akurat dari `postal_code` untuk menghitung ongkir. Biteship merekomendasikan penggunaan `area_id` karena kurir Indonesia menggunakan referensi level kecamatan.

---

## Catatan Teknis

### Sandbox vs Production

| Aspek | Sandbox | Production |
|-------|---------|------------|
| API Error | Fallback ke mock rates | Throw `BiteshipApiException` |
| Empty rates | Fallback ke mock | Throw error |
| No API key | Mock rates | Throw error |
| Webhook verify | Skip jika token kosong | Wajib match |
| createOrder fail | Generate fake AWB | Throw error |

### Idempotency

Webhook handler bersifat **idempoten** — update status shipment berdasarkan `tracking_number` (waybill_id). Jika shipment tidak ditemukan, webhook di-skip (`{ success: false }`).
