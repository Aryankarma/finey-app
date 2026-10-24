import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Debt } from '@/data/seed';
import { withoutSeed } from '@/store/seed-cleanup';
import { deviceStorage } from '@/store/storage';

export const kindLabels: Record<Debt['kind'], string> = {
  loan: 'Loan',
  shared: 'Shared expense',
  payment: 'Payment',
  other: 'Other',
};

export const paidSoFar = (d: Debt) => d.payments.reduce((s, p) => s + p.amount, 0);
export const remaining = (d: Debt) => Math.max(0, d.amount - paidSoFar(d));
export const isSettled = (d: Debt) => remaining(d) === 0;

type DebtsState = {
  debts: Debt[];
  addDebt: (debt: Omit<Debt, 'id' | 'payments'>) => Debt;
  updateDebt: (id: string, patch: Partial<Omit<Debt, 'id' | 'payments'>>) => void;
  removeDebt: (id: string) => void;
  addPayment: (id: string, payment: Debt['payments'][number]) => void;
};

export const useDebts = create<DebtsState>()(
  persist(
    (set) => ({
      debts: [],
      addDebt: (draft) => {
        const debt: Debt = { ...draft, id: `d-${Date.now().toString(36)}`, payments: [] };
        set((s) => ({ debts: [debt, ...s.debts] }));
        return debt;
      },
      updateDebt: (id, patch) => set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      removeDebt: (id) => set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })),
      addPayment: (id, payment) =>
        set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, payments: [...d.payments, payment] } : d)) })),
    }),
    { name: 'finey.debts', storage: deviceStorage, version: 2, migrate: withoutSeed<DebtsState>('debts') },
  ),
);

export function useDebt(id: string | null | undefined): Debt | undefined {
  return useDebts((s) => (id ? s.debts.find((d) => d.id === id) : undefined));
}
