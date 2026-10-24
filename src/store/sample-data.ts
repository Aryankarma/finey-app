import type { CategoryKey, Debt, Entry, Holding } from '@/data/seed';
import { useDebts } from '@/store/debts';
import { currentDay, useEntries } from '@/store/entries';
import { useHoldings } from '@/store/holdings';
import { addDays, daysInMonth, toIso } from '@/ui/format';

// Optional example data for trying Finey: 32 months of everyday spending and income ending today,
// plus a few people and holdings. Every record's id starts with "demo-" so it can be removed
// again without touching anything the person added.

export const SAMPLE_MONTHS = 32;
const PREFIX = 'demo-';
export const isSample = (id: string) => id.startsWith(PREFIX);

// Seeded random numbers, so the sample month looks the same every time it's loaded.
function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Spend = { category: CategoryKey; names: string[]; min: number; max: number; perMonth: [number, number] };

// Everyday spending, roughly how often it happens in a month and what it costs.
const EVERYDAY: Spend[] = [
  { category: 'food', names: ['Swiggy dinner', 'Zomato order', 'Chai and snacks', 'Lunch with team', 'Café coffee', 'Bakery'], min: 120, max: 750, perMonth: [8, 14] },
  { category: 'food', names: ['BigBasket top-up', 'Blinkit groceries', 'DMart run', 'Vegetables and fruit'], min: 400, max: 3200, perMonth: [4, 6] },
  { category: 'transport', names: ['Uber to office', 'Auto ride', 'Metro card recharge', 'Rapido', 'Ola home'], min: 60, max: 420, perMonth: [10, 18] },
  { category: 'transport', names: ['Petrol'], min: 800, max: 2200, perMonth: [1, 2] },
  { category: 'shopping', names: ['Amazon order', 'Myntra', 'Flipkart', 'Shoes', 'Kurta', 'Phone case', 'Headphones'], min: 350, max: 4200, perMonth: [1, 4] },
  { category: 'entertainment', names: ['Movie tickets', 'Concert', 'Bowling', 'Game purchase', 'Weekend outing'], min: 250, max: 2400, perMonth: [1, 3] },
  { category: 'health', names: ['Pharmacy', 'Doctor visit', 'Vitamins'], min: 150, max: 1800, perMonth: [0, 2] },
  { category: 'education', names: ['Udemy course', 'Books', 'Online class'], min: 300, max: 2500, perMonth: [0, 1] },
  { category: 'other', names: ['Gift', 'Haircut', 'Donation', 'Laundry'], min: 150, max: 1500, perMonth: [1, 2] },
];

const round = (n: number, to = 10) => Math.max(to, Math.round(n / to) * to);

function buildEntries(today: string): Entry[] {
  const rand = random(32);
  const between = (min: number, max: number) => min + rand() * (max - min);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const out: Entry[] = [];
  let n = 0;
  const add = (date: string, name: string, category: CategoryKey, amount: number, extra: Partial<Entry> = {}) => {
    if (date > today) return;
    const income = ['salary', 'freelance', 'bonus', 'investment'].includes(category);
    out.push({ id: `${PREFIX}e-${n++}`, date, name, category, type: income ? 'income' : 'expense', amount: Math.round(amount), ...extra });
  };

  const ty = Number(today.slice(0, 4));
  const tm = Number(today.slice(5, 7));
  for (let back = SAMPLE_MONTHS - 1; back >= 0; back--) {
    const total = ty * 12 + (tm - 1) - back;
    const y = Math.floor(total / 12);
    const m = (total % 12) + 1;
    const day = (d: number) => toIso(y, m, Math.min(d, daysInMonth(toIso(y, m, 1))));
    const days = daysInMonth(toIso(y, m, 1));
    const yearsIn = (SAMPLE_MONTHS - 1 - back) / 12; // pay goes up each year

    // Money in
    add(day(1), 'Salary', 'salary', 72000 * (1 + 0.09 * Math.floor(yearsIn)));
    if (rand() < 0.35) add(day(Math.ceil(between(8, 26))), pick(['Logo design project', 'Website fix', 'Freelance invoice']), 'freelance', round(between(8000, 26000), 500));
    if (m === 3) add(day(15), 'Annual bonus', 'bonus', round(between(40000, 70000), 1000));
    if (m % 3 === 0) add(day(20), 'Mutual fund dividend', 'investment', round(between(600, 2400), 50));

    // Fixed bills
    add(day(5), 'Rent', 'utilities', 18000 + 1000 * Math.floor(yearsIn));
    add(day(7), 'Electricity bill', 'utilities', round(between(m >= 4 && m <= 6 ? 2200 : 1100, m >= 4 && m <= 6 ? 3400 : 2100)));
    add(day(10), 'Internet', 'utilities', 999);
    add(day(12), 'Phone recharge', 'utilities', 299);
    add(day(3), 'Gym, monthly', 'health', 1500);
    add(day(15), 'Netflix', 'entertainment', 649);

    // Everyday spending; October and November (festive season) run higher
    const festive = m === 10 || m === 11 ? 1.5 : 1;
    for (const s of EVERYDAY) {
      const count = Math.round(between(s.perMonth[0], s.perMonth[1]) * (s.category === 'shopping' ? festive : 1));
      for (let i = 0; i < count; i++) {
        const d = Math.ceil(rand() * days);
        add(day(d), pick(s.names), s.category, round(between(s.min, s.max) * (s.category === 'shopping' ? festive : 1)), rand() < 0.04 ? { saved: true } : {});
      }
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

function buildDebts(today: string): Debt[] {
  return [
    { id: `${PREFIX}d-rahul`, person: 'Rahul', direction: 'theyOweMe', kind: 'loan', amount: 5000, note: 'Bike repair', date: addDays(today, -40), payments: [{ date: addDays(today, -20), amount: 2000, method: 'UPI' }] },
    { id: `${PREFIX}d-meera`, person: 'Meera', direction: 'theyOweMe', kind: 'shared', amount: 3200, note: 'Her share of the Goa stay', date: addDays(today, -12), payments: [] },
    { id: `${PREFIX}d-priya`, person: 'Priya', direction: 'iOweThem', kind: 'loan', amount: 4000, note: 'Concert tickets', date: addDays(today, -8), payments: [] },
    { id: `${PREFIX}d-arjun`, person: 'Arjun', direction: 'theyOweMe', kind: 'loan', amount: 6000, note: '', date: addDays(today, -200), payments: [{ date: addDays(today, -150), amount: 6000, method: 'Cash' }] },
  ];
}

function buildHoldings(today: string): Holding[] {
  const start = addDays(today, -(SAMPLE_MONTHS * 30));
  return [
    { id: `${PREFIX}h-fd`, name: 'HDFC Bank FD', type: 'fd', platform: 'HDFC', invested: 150000, value: 171200, boughtOn: start },
    { id: `${PREFIX}h-ppfas`, name: 'Parag Parikh Flexi Cap', type: 'funds', platform: 'Groww', invested: 180000, value: 236400, boughtOn: start },
    { id: `${PREFIX}h-sgb`, name: 'Sovereign Gold Bond', type: 'gold', platform: 'Zerodha', invested: 72000, value: 104500 },
    { id: `${PREFIX}h-infy`, name: 'Infosys', type: 'stocks', ticker: 'INFY', quantity: 40, platform: 'Zerodha', invested: 58000, value: 61200, boughtOn: addDays(today, -400) },
    { id: `${PREFIX}h-btc`, name: 'Bitcoin', type: 'crypto', ticker: 'BTC', quantity: 0.0015, platform: 'CoinDCX', invested: 20000, value: 24500 },
  ];
}

export const hasSampleData = (entries: Entry[]) => entries.some((e) => isSample(e.id));

// Adds the sample records next to whatever is already there. Loading twice replaces, never doubles.
export function loadSampleData(): number {
  const today = currentDay();
  const entries = buildEntries(today);
  useEntries.setState((s) => ({ entries: [...s.entries.filter((e) => !isSample(e.id)), ...entries].sort((a, b) => b.date.localeCompare(a.date)) }));
  useDebts.setState((s) => ({ debts: [...s.debts.filter((d) => !isSample(d.id)), ...buildDebts(today)] }));
  useHoldings.setState((s) => ({ holdings: [...s.holdings.filter((h) => !isSample(h.id)), ...buildHoldings(today)] }));
  return entries.length;
}

export function removeSampleData() {
  useEntries.setState((s) => ({ entries: s.entries.filter((e) => !isSample(e.id)) }));
  useDebts.setState((s) => ({ debts: s.debts.filter((d) => !isSample(d.id)) }));
  useHoldings.setState((s) => ({ holdings: s.holdings.filter((h) => !isSample(h.id)) }));
}
