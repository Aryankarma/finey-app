import { create } from 'zustand';

import type { CategoryKey, Entry } from '@/data/seed';
import { currentDay } from '@/store/entries';

// The entry being written on New entry, shared with the description screen it pushes.
type Draft = {
  type: Entry['type'];
  amount: string; // digits typed on the keypad
  category: CategoryKey | null;
  name: string;
  date: string;
};

type DraftState = Draft & {
  set: (patch: Partial<Draft>) => void;
  reset: (keep?: Partial<Draft>) => void;
};

const empty = (): Draft => ({ type: 'expense', amount: '', category: null, name: '', date: currentDay() });

export const useEntryDraft = create<DraftState>()((set) => ({
  ...empty(),
  set: (patch) => set(patch),
  reset: (keep) => set({ ...empty(), ...keep }),
}));
