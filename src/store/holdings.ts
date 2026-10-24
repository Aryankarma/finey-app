import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { knownPrices, type Holding } from '@/data/seed';
import { withoutSeed } from '@/store/seed-cleanup';
import { deviceStorage } from '@/store/storage';

export const typeLabels: Record<Holding['type'], string> = {
  stocks: 'Stocks',
  funds: 'Mutual funds',
  fd: 'Fixed deposit',
  gold: 'Gold',
  crypto: 'Crypto',
  bonds: 'Bonds',
  other: 'Other',
};

// Types with a market price: you enter a ticker and a quantity, and the value follows the price.
export const isMarketType = (t: Holding['type']) => t === 'stocks' || t === 'crypto';
const CRYPTO_TICKERS = ['BTC', 'ETH'];

// Look up a ticker in the prices the prototype knows, for the right kind of holding.
export function lookUpTicker(type: Holding['type'], ticker: string): { name: string; price: number } | null {
  const t = ticker.trim().toUpperCase();
  const hit = knownPrices[t];
  if (!hit || CRYPTO_TICKERS.includes(t) !== (type === 'crypto')) return null;
  return hit;
}

// Price of one share or coin: the known market price, else what the holding is worth per unit.
export function unitPrice(h: Holding): number | null {
  if (!h.quantity) return null;
  return (h.ticker && knownPrices[h.ticker]?.price) || h.value / h.quantity;
}

export const gainOf = (h: Pick<Holding, 'value' | 'invested'>) => h.value - h.invested;
export const returnOf = (h: Pick<Holding, 'value' | 'invested'>) => (h.invested > 0 ? (gainOf(h) / h.invested) * 100 : 0);

type HoldingsState = {
  holdings: Holding[];
  addHolding: (h: Omit<Holding, 'id'>) => Holding;
  updateHolding: (id: string, patch: Partial<Omit<Holding, 'id'>>) => void;
  removeHolding: (id: string) => void;
};

export const useHoldings = create<HoldingsState>()(
  persist(
    (set) => ({
      holdings: [],
      addHolding: (draft) => {
        const holding: Holding = { ...draft, id: `h-${Date.now().toString(36)}` };
        set((s) => ({ holdings: [...s.holdings, holding] }));
        return holding;
      },
      updateHolding: (id, patch) => set((s) => ({ holdings: s.holdings.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      removeHolding: (id) => set((s) => ({ holdings: s.holdings.filter((h) => h.id !== id) })),
    }),
    { name: 'finey.holdings', storage: deviceStorage, version: 2, migrate: withoutSeed<HoldingsState>('holdings') },
  ),
);

export function useHolding(id: string | null | undefined): Holding | undefined {
  return useHoldings((s) => (id ? s.holdings.find((h) => h.id === id) : undefined));
}
