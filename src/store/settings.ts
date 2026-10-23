import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { deviceStorage } from '@/store/storage';

type SettingsState = {
  hideAmounts: boolean; // the eye button on Home; every Amount reads it
  toggleHideAmounts: () => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      hideAmounts: false,
      toggleHideAmounts: () => set((s) => ({ hideAmounts: !s.hideAmounts })),
    }),
    { name: 'finey.settings', storage: deviceStorage, version: 1 },
  ),
);
