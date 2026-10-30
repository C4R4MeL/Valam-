#!/bin/bash

# ============================================================
# Supabase Market Prices Update Script
# ============================================================
# Script baca saja untuk memeriksa harga tersimpan.

echo "🔄 Reading Supabase market prices..."
echo ""

# Pastikan environment variables tersedia
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables"
  echo "Please set them or run from VS Code terminal"
  exit 1
fi

# Call Supabase API via curl untuk update prices
# Ini adalah alternative approach jika migration belum bisa di-run

echo "Fetching current market prices..."
curl -s \
  -H "apikey: $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  "$SUPABASE_URL/rest/v1/insights_market_prices?select=*" \
  | jq .

echo ""
echo "✅ Pembacaan selesai. Perbarui harga melalui halaman Admin > Insights > Harga Pasar."
