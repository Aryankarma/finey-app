import type { Holding } from '@/data/seed';
import { monthName } from '@/ui/format';

// Short code in the round badge: FD, MF, Au, IN, BTC.
export function holdingCode(h: Holding): string {
  if (h.type === 'crypto' && h.ticker) return h.ticker.slice(0, 3);
  if (h.type === 'stocks') return (h.ticker ?? h.name).slice(0, 2).toUpperCase();
  return { stocks: 'ST', funds: 'MF', fd: 'FD', gold: 'Au', crypto: 'CR', bonds: 'BD', other: '••' }[h.type];
}

export const unitWord = (h: Pick<Holding, 'type'>, n = 2) => (h.type === 'crypto' ? (n === 1 ? 'coin' : 'coins') : n === 1 ? 'share' : 'shares');

// "Jan 2025" / "12 Mar 2025"
export const monthYear = (iso: string) => `${monthName(iso, 'short')} ${iso.slice(0, 4)}`;
export const dayMonthYear = (iso: string) => `${Number(iso.slice(8, 10))} ${monthYear(iso)}`;

// The line under a holding's name: "40 shares on Zerodha, live price", "HDFC, since Jan 2025", "Groww"
export function holdingMeta(h: Holding): string {
  if (h.quantity && h.ticker) {
    const amount = h.type === 'crypto' ? `${h.quantity} ${h.ticker}` : `${h.quantity} ${unitWord(h, h.quantity)}`;
    return `${amount} on ${h.platform}, live price`;
  }
  if (h.type === 'fd' && h.boughtOn) return `${h.platform}, since ${monthYear(h.boughtOn)}`;
  return h.platform;
}
