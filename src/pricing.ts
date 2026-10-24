/**
 * Phase A indicative client-side exchange rate. The free public endpoint updates daily,
 * NOT at every transaction. Phase B must lock a server-side quote for each order.
 */
export const DEMO_USD_TO_IDR = 18000;
export const INTERNATIONAL_MULTIPLIER = 3;
export type FxQuote = { usdToIdr: number; asOf: string; source: 'api' | 'demo'; fetchedAt: number };
const FX_CACHE_KEY = 'cocioco.fx.v1';
const ONE_DAY = 24 * 60 * 60 * 1000;

export async function loadUsdIdr(signal?: AbortSignal, force = false): Promise<FxQuote> {
  if (!force) {
    try {
      const cached = JSON.parse(localStorage.getItem(FX_CACHE_KEY) || 'null') as FxQuote | null;
      if (cached?.source === 'api' && Number.isFinite(cached.usdToIdr) && cached.usdToIdr > 0 && Date.now() - cached.fetchedAt < ONE_DAY) return cached;
    } catch { /* stale cache */ }
  }
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', { signal });
    if (!response.ok) throw new Error('FX service unavailable');
    const result = await response.json() as { result?: string; rates?: { IDR?: number }; time_last_update_utc?: string };
    const rate = result.rates?.IDR;
    if (result.result !== 'success' || !rate || !Number.isFinite(rate) || rate < 1000) throw new Error('Invalid FX quote');
    const quote: FxQuote = { usdToIdr: rate, source: 'api', asOf: result.time_last_update_utc || new Date().toISOString(), fetchedAt: Date.now() };
    try { localStorage.setItem(FX_CACHE_KEY, JSON.stringify(quote)); } catch { /* storage disabled */ }
    return quote;
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;
    return { usdToIdr: DEMO_USD_TO_IDR, source: 'demo', asOf: '', fetchedAt: Date.now() };
  }
}
export function quotePrice(idrAmount: number, country: string, usdToIdr: number): number {
  if (!country || country === 'ID') return Math.round(idrAmount);
  return Math.round(idrAmount / usdToIdr * INTERNATIONAL_MULTIPLIER * 100) / 100;
}
export function showCurrency(value: number, currency: 'IDR' | 'USD') {
  return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
    style: 'currency', currency, maximumFractionDigits: currency === 'IDR' ? 0 : 2,
    minimumFractionDigits: currency === 'IDR' ? 0 : 2,
  }).format(value);
}
