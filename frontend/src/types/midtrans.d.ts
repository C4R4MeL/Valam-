/**
 * Midtrans Snap.js type declarations.
 * @see https://docs.midtrans.com/reference/snap-js
 */

interface SnapResult {
  order_id: string;
  transaction_id?: string;
  transaction_status?: string;
  payment_type?: string;
  gross_amount?: string;
  status_code?: string;
  status_message?: string;
  fraud_status?: string;
  finish_redirect_url?: string;
  pdf_url?: string;
}

interface SnapCallbacks {
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: SnapResult) => void;
  onClose?: () => void;
}

interface Snap {
  pay: (token: string, callbacks?: SnapCallbacks) => void;
  show: () => void;
  hide: () => void;
}

interface Window {
  snap?: Snap;
}
