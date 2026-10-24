import { debts, entries, fillerEntries, holdings } from '@/data/seed';

// Earlier builds started everyone on the boards' sample month. Stores bumped to version 2
// drop those sample records on load and keep anything the person added themselves.
const seedIds = new Set([...entries, ...fillerEntries, ...debts, ...holdings].map((r) => r.id));

export const isSeedId = (id: string) => seedIds.has(id);

// A persist `migrate` that filters the sample records out of one list in the store.
export function withoutSeed<S>(key: keyof S & string) {
  return (persisted: unknown, version: number): S => {
    const state = persisted as Record<string, unknown>;
    const list = state?.[key];
    if (version < 2 && Array.isArray(list)) return { ...state, [key]: list.filter((r: { id: string }) => !isSeedId(r.id)) } as S;
    return state as S;
  };
}
