# Midtrans Payment Gateway Integration

Dokumentasi integrasi Midtrans Snap untuk platform VALAM.

## Environment Variables

### Backend (`backend/.env`)

```env
# Midtrans Server Key (JANGAN expose ke frontend!)
MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxxxxxx

# Midtrans Client Key
MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxxxxxx

# Optional: Set true untuk production (default: false/sandbox)
MIDTRANS_IS_PRODUCTION=false
```

### Frontend (`frontend/.env`)

```env
# Midtrans Client Key (public, aman untuk frontend)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxxxxxx

# Optional: Set true untuk production (default: false/sandbox)
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
```

> **PENTING**: `MIDTRANS_SERVER_KEY` hanya boleh ada di backend. Jangan pernah mengeksposnya ke frontend, commit ke git, atau print ke log/console.

---

## Arsitektur Alur Pembayaran

```
┌──────────┐     1. POST /orders/checkout     ┌──────────┐     2. createTransaction()     ┌──────────┐
│ Frontend │ ──────────────────────────────────▶│ Backend  │ ──────────────────────────────▶│ Midtrans │
│ Checkout │                                   │ NestJS   │                                │ API      │
│ Page     │◀────────────────────────────────── │ Orders + │ ◀──────────────────────────────│          │
│          │   { orderId, snapToken }          │ Payment  │   { token, redirect_url }      │          │
└──────┬───┘                                   └──────┬───┘                                └────┬─────┘
       │                                              │                                         │
       │ 3. window.snap.pay(token)                    │                                         │
       │──────────────────────────────────────────────────────────────────────────────────────▶  │
       │                                              │                                         │
       │ 4. User completes payment in Snap popup      │   5. POST /payment/notification         │
       │◀─────────────────────────────────────────────────────────────────────────────────────  │
       │   onSuccess/onPending/onError/onClose         │◀──────────────────────────────────────  │
       │                                              │   (webhook server-to-server)             │
       │ 6. GET /payment/status/:orderId              │                                         │
       │──────────────────────────────────────────────▶│   7. Update Order + Payment status      │
       │◀──────────────────────────────────────────── │                                         │
       │   { paymentStatus: 'COMPLETED' }             │                                         │
```

---

## API Endpoints

### Orders

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/api/orders/checkout` | Bearer (BUYER) | Buat order + generate Snap token |
| `PUT` | `/api/orders/:id/retry-payment` | Bearer (BUYER) | Re-generate Snap token untuk order UNPAID |
| `GET` | `/api/orders/buyer` | Bearer (BUYER) | Daftar pesanan buyer |

### Payment

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/api/payment/notification` | **None** (webhook dari Midtrans) | Terima notifikasi pembayaran |
| `GET` | `/api/payment/status/:orderId` | Bearer | Cek status pembayaran order |

---

## Setup Payment Notification URL di Dashboard Midtrans

### Untuk Testing Lokal (via ngrok/tunnel)

1. Install ngrok: `npm install -g ngrok` atau download dari [ngrok.com](https://ngrok.com)
2. Jalankan backend: `npm run start:dev` (port 3001)
3. Buat tunnel: `ngrok http 3001`
4. Copy URL tunnel (contoh: `https://abc123.ngrok.io`)
5. Buka [Midtrans Dashboard Sandbox](https://dashboard.sandbox.midtrans.com)
6. Pergi ke **Settings → Configuration → Payment Notification URL**
7. Set URL: `https://abc123.ngrok.io/api/payment/notification`
8. Klik **Update**

### Untuk Production / Deployment

1. Set Payment Notification URL ke: `https://api.valam.my.id/api/payment/notification`
2. Pastikan endpoint bisa diakses publik (tidak diblokir firewall/WAF)
3. Pastikan endpoint selalu return HTTP 200

---

## Cara Menguji

### 1. Test Kartu Kredit (Sandbox)

| Field | Value |
|-------|-------|
| Card Number | `4811 1111 1111 1114` |
| CVV | `123` |
| Expiry | Bulan/tahun di masa depan (contoh: `12/25`) |
| OTP | `112233` |

### 2. Test GoPay (Sandbox)

- Pilih GoPay di popup Snap
- Scan QR code dengan app simulator Midtrans
- Atau gunakan Midtrans Simulator di dashboard

### 3. Test BCA Virtual Account

- Pilih Bank Transfer → BCA
- Catat nomor VA yang muncul
- Gunakan Midtrans Simulator untuk simulasi pembayaran

### 4. Simulasi Webhook Manual

```bash
# Simulasi pembayaran settlement
curl -X POST http://localhost:3001/api/payment/notification \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER_ID_DISINI",
    "transaction_status": "settlement",
    "status_code": "200",
    "gross_amount": "1000000.00",
    "payment_type": "credit_card",
    "transaction_id": "test-txn-123",
    "fraud_status": "accept",
    "signature_key": ""
  }'
```

### 5. Midtrans Simulator

1. Buka [Midtrans Dashboard Sandbox](https://dashboard.sandbox.midtrans.com)
2. Pergi ke **Tools → Simulator**
3. Pilih payment type dan masukkan detail transaksi
4. Klik simulate → webhook akan dikirim ke Notification URL

---

## Skenario Yang Ditangani

| Skenario | Frontend | Backend |
|----------|----------|---------|
| Pembayaran sukses | `onSuccess` → polling → tampilkan "Berhasil" | Webhook `settlement` → Payment `COMPLETED` |
| Pembayaran pending (VA/bank) | `onPending` → polling otomatis | Webhook `pending` → Payment `PENDING` |
| Pembayaran gagal/deny | `onError` → tombol retry | Webhook `deny` → Payment `FAILED`, stock restored |
| Popup ditutup | `onClose` → tombol "Lanjutkan Pembayaran" | Tidak ada perubahan, order tetap `UNPAID` |
| Token expire | User retry → generate token baru | `retryPayment()` → `createTransaction()` baru |
| Webhook ganda | - | Idempotent: skip jika sudah `COMPLETED` |
| Refund | - | Webhook `refund` → Payment `REFUNDED` |

---

## Checklist Pindah ke Production

- [ ] Daftar akun Midtrans Production: [midtrans.com](https://midtrans.com)
- [ ] Selesaikan proses onboarding merchant (1-2 minggu)
- [ ] Ganti Server Key & Client Key dengan key Production
- [ ] Set environment variables:
  - `MIDTRANS_IS_PRODUCTION=true`
  - `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true`
- [ ] Set Payment Notification URL di Dashboard Production
- [ ] Pastikan HTTPS aktif di server production
- [ ] Test end-to-end dengan kartu/rekening asli (transaksi kecil)
- [ ] Monitor log webhook di Dashboard Midtrans
- [ ] Setup monitoring/alerting untuk webhook failures

---

## Catatan Teknis

### Webhook Security

Webhook diverifikasi melalui **Signature Key Verification**:
```
signature_key = SHA512(order_id + status_code + gross_amount + serverKey)
```

Ini memastikan bahwa notifikasi benar-benar berasal dari Midtrans dan belum dimodifikasi.

### Idempotency

Handler webhook bersifat idempoten — jika Midtrans mengirim notifikasi ganda untuk transaksi yang sama, sistem hanya memproses yang pertama. Notifikasi berikutnya di-skip karena payment sudah dalam status terminal (`COMPLETED` atau `REFUNDED`).

### Stock Management

- **Checkout**: Stock di-decrement (reserved) saat order dibuat.
- **Payment Failed/Expired**: Stock di-restore otomatis via webhook handler.
- **Cancel**: Stock di-restore via `updateOrderStatus()`.
