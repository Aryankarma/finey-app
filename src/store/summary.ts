import type { CategoryKey, Entry } from '@/data/seed';
import { dayOfMonth } from '@/ui/format';

// Totals worked out from the entry list. Never stored, so they can't drift from the entries.

export function inMonth(entries: Entry[], day: string): Entry[] {
  const month = day.slice(0, 7);
  return entries.filter((e) => e.date.startsWith(month) && e.date <= day);
}

export function monthSummary(entries: Entry[], day: string) {
  const month = inMonth(entries, day);
  let income = 0;
  let spent = 0;
  for (const e of month) {
    if (e.type === 'income') income += e.amount;
    else spent += e.amount;
  }
  const net = income - spent;
  return { income, spent, net, savingsRate: income > 0 ? (net / income) * 100 : 0 };
}

// Spending on each day from the 1st up to `day`.
export function dailySpend(entries: Entry[], day: string): number[] {
  const totals = new Array<number>(dayOfMonth(day)).fill(0);
  for (const e of inMonth(entries, day)) {
    if (e.type === 'expense') totals[dayOfMonth(e.date) - 1] += e.amount;
  }
  return totals;
}

export function incomeDays(entries: Entry[], day: string): number[] {
  return [...new Set(inMonth(entries, day).filter((e) => e.type === 'income').map((e) => dayOfMonth(e.date)))];
}

export type HistoryItem = { name: string; category: CategoryKey; type: Entry['type']; uses: number; last: number };

// Past descriptions, most used first, for the description suggestions.
export function descriptionHistory(entries: Entry[]): HistoryItem[] {
  const byName = new Map<string, HistoryItem>();
  for (const e of entries) {
    const key = e.name.toLowerCase();
    const seen = byName.get(key);
    // entries are newest first, so the first one seen holds the latest amount and category
    if (seen) seen.uses += 1;
    else byName.set(key, { name: e.name, category: e.category, type: e.type, uses: 1, last: e.amount });
  }
  return [...byName.values()].sort((a, b) => b.uses - a.uses);
}
