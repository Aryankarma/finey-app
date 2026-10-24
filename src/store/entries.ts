import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Entry } from '@/data/seed';
import { withoutSeed } from '@/store/seed-cleanup';
import { deviceStorage } from '@/store/storage';
import { toIso } from '@/ui/format';

// The app's "today": the phone's local date, as YYYY-MM-DD.
export function currentDay(): string {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

const byNewest = (a: Entry, b: Entry) => b.date.localeCompare(a.date);

type EntriesState = {
  entries: Entry[]; // newest day first
  addEntry: (entry: Omit<Entry, 'id' | 'createdAt'>) => Entry;
  updateEntry: (id: string, patch: Partial<Omit<Entry, 'id'>>) => void;
  toggleSaved: (id: string) => void;
  // Returns what removeEntry took out so it can be put back with restoreEntry.
  removeEntry: (id: string) => { entry: Entry; index: number } | null;
  restoreEntry: (removed: { entry: Entry; index: number }) => void;
};

export const useEntries = create<EntriesState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (draft) => {
        const entry: Entry = { ...draft, id: `e-${Date.now().toString(36)}`, createdAt: new Date().toISOString() };
        // New entries go above older ones on the same day.
        set((s) => ({ entries: [entry, ...s.entries].sort(byNewest) }));
        return entry;
      },
      updateEntry: (id, patch) =>
        set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)).sort(byNewest) })),
      toggleSaved: (id) => set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, saved: !e.saved } : e)) })),
      removeEntry: (id) => {
        const index = get().entries.findIndex((e) => e.id === id);
        if (index < 0) return null;
        const entry = get().entries[index];
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
        return { entry, index };
      },
      restoreEntry: ({ entry, index }) =>
        set((s) => {
          if (s.entries.some((e) => e.id === entry.id)) return s;
          const next = [...s.entries];
          next.splice(Math.min(index, next.length), 0, entry);
          return { entries: next.sort(byNewest) };
        }),
    }),
    { name: 'finey.entries', storage: deviceStorage, version: 2, migrate: withoutSeed<EntriesState>('entries') },
  ),
);

export function useEntry(id: string | null | undefined): Entry | undefined {
  return useEntries((s) => (id ? s.entries.find((e) => e.id === id) : undefined));
}
