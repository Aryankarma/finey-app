// Sample data used by the V4 boards. October 2026; today is Wednesday 21 October.
// Every number on the boards comes from here, so keep them in step if you change anything.
// Amounts are whole rupees.

export type CategoryKey =
  | 'food' | 'transport' | 'utilities' | 'shopping' | 'entertainment' | 'health' | 'education' | 'other'
  | 'salary' | 'freelance' | 'bonus' | 'investment';

export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  category: CategoryKey;
  type: 'expense' | 'income';
  amount: number;
  saved?: boolean;
  source?: 'keypad' | 'voice' | 'paste';
  createdAt?: string; // ISO time the entry was added in the app
}

export interface Debt {
  id: string;
  person: string;
  direction: 'theyOweMe' | 'iOweThem';
  kind: 'loan' | 'shared' | 'payment' | 'other';
  amount: number;
  note: string;
  date: string;
  payments: { date: string; amount: number; method?: string }[];
}

export interface Holding {
  id: string;
  name: string;
  type: 'stocks' | 'funds' | 'fd' | 'gold' | 'crypto' | 'bonds' | 'other';
  ticker?: string;
  quantity?: number;
  platform: string;
  invested: number;
  value: number;
  boughtOn?: string;
}

export const today = '2026-10-21';

// The boards show these totals for all of October so far.
export const monthSummary = {
  income: 124500,
  spent: 68240,
  net: 56260,
  savingsRate: 45.2, // percent of income kept
  expenseCount: 58,
  incomeCount: 2,
  suggestedBudget: 81238,
};

// Spending per day, 1 to 21 October. Sums to 68,240.
export const dailySpend = [1450, 2980, 14446, 5200, 2310, 1240, 3890, 640, 2100, 4720, 3360, 980, 1750, 2890, 6420, 2210, 1520, 1860, 5170, 2618, 486];

// Sums to 68,240.
export const categoryTotals: Record<string, number> = {
  food: 18420, utilities: 12600, shopping: 11850, transport: 9340,
  entertainment: 6780, health: 4950, education: 3200, other: 1100,
};

// The 27 entries the boards show by name: every entry on 1, 2, 3, 18, 19, 20 and 21 October,
// all 15 Food & Dining entries, and both incomes. The other 33 expenses are not drawn on any
// board, so generate them to fit dailySpend and categoryTotals if you need a full list.
const e = (date: number, name: string, category: CategoryKey, amount: number, extra: Partial<Entry> = {}): Entry => ({
  id: `e-${date}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${amount}`,
  date: `2026-10-${String(date).padStart(2, '0')}`,
  name,
  category,
  type: category === 'salary' || category === 'freelance' ? 'income' : 'expense',
  amount,
  ...extra,
});

export const entries: Entry[] = [
  e(21, 'Swiggy dinner', 'food', 486, { source: 'voice' }),
  e(20, 'Electricity bill', 'utilities', 2140, { saved: true }),
  e(20, 'Uber to office', 'transport', 238),
  e(20, 'BigBasket top-up', 'food', 240),
  e(19, 'Headphones', 'shopping', 3499),
  e(19, 'Gym, monthly', 'health', 1200),
  e(19, 'Chai and snacks', 'food', 471),
  e(18, 'Dinner out', 'food', 1860),
  e(16, 'Swiggy lunch', 'food', 620),
  e(15, 'Monthly groceries', 'food', 3940, { saved: true }),
  e(14, 'Landing page project', 'freelance', 14500),
  e(13, 'Zomato order', 'food', 540),
  e(12, 'Bakery', 'food', 483),
  e(11, 'Café with friends', 'food', 1150),
  e(10, 'Groceries, DMart', 'food', 2880),
  e(9, 'Chai and snacks', 'food', 340),
  e(7, 'Swiggy dinner', 'food', 520),
  e(4, 'Birthday dinner', 'food', 2460, { saved: true }),
  e(3, 'Society maintenance', 'utilities', 9000),
  e(3, 'Running shoes', 'shopping', 4999),
  e(3, 'Auto rides', 'transport', 447),
  e(2, 'Groceries, BigBasket', 'food', 1980),
  e(2, 'Movie tickets', 'entertainment', 1000),
  e(1, 'Salary', 'salary', 110000),
  e(1, 'Swiggy dinner', 'food', 450),
  e(1, 'Metro card top-up', 'transport', 500),
  e(1, 'Mobile recharge', 'utilities', 500),
];

// The 33 expenses no board draws. Together with `entries` they add up to dailySpend,
// categoryTotals and monthSummary exactly, so the app works those totals out from the list.
export const fillerEntries: Entry[] = [
  e(17, 'Auto ride', 'transport', 127),
  e(17, 'Phone case', 'shopping', 393),
  e(17, 'Dental check-up', 'health', 1000),
  e(16, 'Auto rides', 'transport', 390),
  e(16, 'Game top-up', 'entertainment', 1200),
  e(15, 'Vitamins', 'health', 320),
  e(15, 'Uber rides', 'transport', 1047),
  e(15, 'Movie night', 'entertainment', 1113),
  e(14, 'Gift wrap and card', 'other', 330),
  e(14, 'Bedsheets', 'shopping', 1060),
  e(14, 'Petrol', 'transport', 1500),
  e(13, 'Uber to office', 'transport', 560),
  e(13, 'Pharmacy', 'health', 650),
  e(12, 'Auto ride', 'transport', 378),
  e(12, 'Spotify', 'entertainment', 119),
  e(11, 'Laundry', 'other', 420),
  e(11, 'Uber to office', 'transport', 589),
  e(11, 'Books', 'education', 1201),
  e(10, 'Internet bill', 'utilities', 960),
  e(10, 'Doctor visit', 'health', 880),
  e(9, 'Auto rides', 'transport', 261),
  e(9, 'Comedy show', 'entertainment', 1499),
  e(8, 'Metro card top-up', 'transport', 640),
  e(7, 'Petrol', 'transport', 1471),
  e(7, 'Kurta', 'shopping', 1899),
  e(6, 'Haircut', 'other', 350),
  e(6, 'Uber to office', 'transport', 241),
  e(6, 'Netflix', 'entertainment', 649),
  e(5, 'Auto ride', 'transport', 311),
  e(5, 'Online course', 'education', 1999),
  e(4, 'Pharmacy', 'health', 900),
  e(4, 'Uber rides', 'transport', 640),
  e(4, 'Bowling night', 'entertainment', 1200),
];

// Owed to you: 8,750. You owe: 4,000. The boards don't show dates for Meera and Priya, so theirs are placeholders.
export const debts: Debt[] = [
  { id: 'd-rahul', person: 'Rahul', direction: 'theyOweMe', kind: 'loan', amount: 1000, note: '', date: '2026-10-02', payments: [{ date: '2026-10-12', amount: 250, method: 'UPI' }] },
  { id: 'd-arjun', person: 'Arjun', direction: 'theyOweMe', kind: 'loan', amount: 6000, note: '', date: '2026-09-28', payments: [] },
  { id: 'd-meera', person: 'Meera', direction: 'theyOweMe', kind: 'shared', amount: 2000, note: 'Her share of the Goa stay', date: '2026-10-05', payments: [] },
  { id: 'd-priya', person: 'Priya', direction: 'iOweThem', kind: 'loan', amount: 4000, note: 'Concert tickets', date: '2026-10-08', payments: [] },
];

// Worth 4,82,300 on 4,10,000 put in (+72,300, 17.63%).
export const holdings: Holding[] = [
  { id: 'h-fd', name: 'HDFC Bank FD', type: 'fd', platform: 'HDFC', invested: 150000, value: 158400, boughtOn: '2025-01-01' }, // boards say "since Jan 2025"
  { id: 'h-ppfas', name: 'Parag Parikh Flexi Cap', type: 'funds', platform: 'Groww', invested: 110000, value: 141700 },
  { id: 'h-sgb', name: 'Sovereign Gold Bond', type: 'gold', platform: 'Zerodha', invested: 72000, value: 96500 },
  { id: 'h-infy', name: 'Infosys', type: 'stocks', ticker: 'INFY', quantity: 40, platform: 'Zerodha', invested: 58000, value: 61200, boughtOn: '2025-03-12' },
  { id: 'h-btc', name: 'Bitcoin', type: 'crypto', ticker: 'BTC', quantity: 0.0015, platform: 'CoinDCX', invested: 20000, value: 24500 },
];

// Prices the New holding lookup knows about in the prototype.
export const knownPrices: Record<string, { name: string; price: number }> = {
  TCS: { name: 'Tata Consultancy Services', price: 4120 },
  INFY: { name: 'Infosys', price: 1530 },
  HDFCBANK: { name: 'HDFC Bank', price: 1690 },
  BTC: { name: 'Bitcoin', price: 16333333 },
  ETH: { name: 'Ethereum', price: 312000 },
};

// The boards use 12345 as the privacy PIN. In the real app store the PIN with
// expo-secure-store and never ship a default.
export const prototypePin = '12345';
