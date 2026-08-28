-- ============================================================
-- Valam B2B Platform — Row Level Security (RLS) Enablement & Secure RPC
-- ============================================================

-- ── 1. Enable RLS on Core Marketplace Tables ────────────────
ALTER TABLE IF EXISTS public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.circular_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qc_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rfq_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rfq_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shipment_tracking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.supplier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trace_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.withdrawals ENABLE ROW LEVEL SECURITY;

-- ── 2. Create Secure RPC Statistics Function ────────────────
CREATE OR REPLACE FUNCTION get_supplier_stats()
RETURNS JSON AS $$
DECLARE
  koperasi_count INT;
  kabupaten_count INT;
BEGIN
  SELECT COUNT(*), COUNT(DISTINCT kabupaten)
  INTO koperasi_count, kabupaten_count
  FROM public.supplier_profiles
  WHERE status = 'TERVERIFIKASI' OR status = 'LEGACY_VERIFIED';

  RETURN json_build_object(
    'active_koperasi_count', koperasi_count,
    'active_kabupaten_count', kabupaten_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
