import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { entries as namedEntries, fillerEntries, today as seedToday, type Entry } from '@/data/seed';
import { deviceStorage } from '@/store/storage';

// The app's "today". Pinned to the seed data's date so the sample month reads as designed;
// switch to the real date once the seed data is no longer needed.
export function currentDay(): string {
  return seedToday;
}

const byNewest = (a: Entry, b: Entry) => b.date.localeCompare(a.date);

type EntriesState = {
  entries: Entry[]; // newest day first
  addEntry: (entry: Omit<Entry, 'id'>) => Entry;
};

export const useEntries = create<EntriesState>()(
  persist(
    (set) => ({
      entries: [...namedEntries, ...fillerEntries].sort(byNewest),
      addEntry: (draft) => {
        const entry: Entry = { ...draft, id: `e-${Date.now().toString(36)}` };
        // New entries go above older ones on the same day.
        set((s) => ({ entries: [entry, ...s.entries].sort(byNewest) }));
        return entry;
      },
    }),
    { name: 'finey.entries', storage: deviceStorage, version: 1 },
  ),
);
