import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { deviceStorage } from '@/store/storage';
import type { AccentKey } from '@/ui/theme';

export type { AccentKey };
export type ThemeChoice = 'system' | 'dark' | 'light';

type SettingsState = {
  hideAmounts: boolean; // the eye button on Home; every Amount reads it
  toggleHideAmounts: () => void;
  setHideAmounts: (hidden: boolean) => void;
  hideOnOpen: boolean; // start every launch with amounts hidden
  fingerprint: boolean; // offer fingerprint/face unlock next to the PIN
  theme: ThemeChoice;
  accent: AccentKey;
  monthlyBudget: number | null; // set from Spending trends
  setMonthlyBudget: (amount: number | null) => void;
  set: (patch: Partial<Pick<SettingsState, 'hideOnOpen' | 'fingerprint' | 'theme' | 'accent'>>) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      hideAmounts: false,
      toggleHideAmounts: () => set((s) => ({ hideAmounts: !s.hideAmounts })),
      setHideAmounts: (hideAmounts) => set({ hideAmounts }),
      hideOnOpen: true,
      fingerprint: true,
      theme: 'dark',
      accent: 'iris',
      monthlyBudget: null,
      setMonthlyBudget: (monthlyBudget) => set({ monthlyBudget }),
      set: (patch) => set(patch),
    }),
    {
      name: 'finey.settings',
      storage: deviceStorage,
      version: 1,
      // "Hide amounts when Finey opens" wins over however the last session ended.
      onRehydrateStorage: () => (state) => {
        if (state?.hideOnOpen) useSettings.setState({ hideAmounts: true });
      },
    },
  ),
);
