import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { deviceStorage } from '@/store/storage';

type SettingsState = {
  hideAmounts: boolean; // the eye button on Home; every Amount reads it
  toggleHideAmounts: () => void;
  monthlyBudget: number | null; // set from Spending trends
  setMonthlyBudget: (amount: number | null) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      hideAmounts: false,
      toggleHideAmounts: () => set((s) => ({ hideAmounts: !s.hideAmounts })),
      monthlyBudget: null,
      setMonthlyBudget: (monthlyBudget) => set({ monthlyBudget }),
    }),
    { name: 'finey.settings', storage: deviceStorage, version: 1 },
  ),
);
