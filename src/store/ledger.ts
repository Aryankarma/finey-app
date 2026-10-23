import { create } from 'zustand';

import type { Entry } from '@/data/seed';
import { inMonth } from '@/store/summary';
import { categories } from '@/ui/categories';

export type LedgerShow = 'all' | 'expense' | 'income';
export type LedgerSort = 'newest' | 'oldest' | 'high' | 'low';
export type LedgerFilters = { show: LedgerShow; savedOnly: boolean; sort: LedgerSort };

export const defaultFilters: LedgerFilters = { show: 'all', savedOnly: false, sort: 'newest' };

export const sortLabels: Record<LedgerSort, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  high: 'Highest amount',
  low: 'Lowest amount',
};

// What the Ledger list is showing. Kept while you move between tabs; not saved to the device.
type LedgerState = LedgerFilters & {
  query: string;
  setQuery: (query: string) => void;
  setFilters: (filters: LedgerFilters) => void;
};

export const useLedger = create<LedgerState>()((set) => ({
  ...defaultFilters,
  query: '',
  setQuery: (query) => set({ query }),
  setFilters: (filters) => set(filters),
}));

export const isDefaultFilters = (f: LedgerFilters) =>
  f.show === defaultFilters.show && f.savedOnly === defaultFilters.savedOnly && f.sort === defaultFilters.sort;

export const signedAmount = (e: Entry) => (e.type === 'income' ? e.amount : -e.amount);

// The month's entries after search, filters and sort.
export function ledgerEntries(entries: Entry[], day: string, filters: LedgerFilters, query: string): Entry[] {
  const q = query.trim().toLowerCase();
  const list = inMonth(entries, day).filter((e) => {
    if (filters.show !== 'all' && e.type !== filters.show) return false;
    if (filters.savedOnly && !e.saved) return false;
    if (q && !e.name.toLowerCase().includes(q) && !categories[e.category].label.toLowerCase().includes(q)) return false;
    return true;
  });
  switch (filters.sort) {
    case 'oldest':
      return list.reverse();
    case 'high':
      return list.sort((a, b) => b.amount - a.amount);
    case 'low':
      return list.sort((a, b) => a.amount - b.amount);
    default:
      return list;
  }
}

// "58 expenses", "3 saved entries", "No saved income".
export function countLabel(count: number, filters: LedgerFilters): string {
  const nouns = { all: ['entry', 'entries'], expense: ['expense', 'expenses'], income: ['income entry', 'income entries'] }[filters.show];
  const saved = filters.savedOnly ? 'saved ' : '';
  if (count === 0) return `No ${saved}${filters.show === 'income' ? 'income' : nouns[1]}`;
  return `${count} ${saved}${count === 1 ? nouns[0] : nouns[1]}`;
}
