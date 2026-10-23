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

// Spending per category this month, biggest first.
export function categorySpend(entries: Entry[], day: string): { category: CategoryKey; total: number; count: number }[] {
  const totals = new Map<CategoryKey, { total: number; count: number }>();
  for (const e of inMonth(entries, day)) {
    if (e.type !== 'expense') continue;
    const t = totals.get(e.category) ?? { total: 0, count: 0 };
    t.total += e.amount;
    t.count += 1;
    totals.set(e.category, t);
  }
  return [...totals.entries()].map(([category, t]) => ({ category, ...t })).sort((a, b) => b.total - a.total);
}

export type WeekBucket = { from: number; to: number; total: number; started: boolean; current: boolean };

// The month cut into 1–7, 8–14, 15–21 and 22 to the end, as on V4-Spending.
export function weekBuckets(spend: number[], day: string, monthDays: number): WeekBucket[] {
  const today = dayOfMonth(day);
  return [1, 8, 15, 22].map((from, i, starts) => {
    const to = i === starts.length - 1 ? monthDays : starts[i + 1] - 1;
    const total = spend.slice(from - 1, Math.min(to, today)).reduce((a, b) => a + b, 0);
    return { from, to, total, started: from <= today, current: from <= today && today <= to };
  });
}

// Money left at the end of each day: income minus spending, running from the 1st.
export function runningBalance(entries: Entry[], day: string): { balance: number; income: number; spent: number }[] {
  const days = Array.from({ length: dayOfMonth(day) }, () => ({ balance: 0, income: 0, spent: 0 }));
  for (const e of inMonth(entries, day)) {
    const d = days[dayOfMonth(e.date) - 1];
    if (e.type === 'income') d.income += e.amount;
    else d.spent += e.amount;
  }
  let run = 0;
  for (const d of days) {
    run += d.income - d.spent;
    d.balance = run;
  }
  return days;
}

// The suggested monthly budget: 25 days at the current average daily spend.
export const BUDGET_DAYS = 25;
export function suggestedBudget(spent: number, daysSoFar: number): number {
  return Math.round((spent / daysSoFar) * BUDGET_DAYS);
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
