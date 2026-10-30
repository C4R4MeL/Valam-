export const MARKET_PRICES_UPDATED = 'valam:market-prices-updated';

export function notifyMarketPricesUpdated() {
  window.dispatchEvent(new Event(MARKET_PRICES_UPDATED));
  try {
    localStorage.setItem(MARKET_PRICES_UPDATED, String(Date.now()));
  } catch { /* Focus and periodic refresh also keep other tabs current. */ }
}
