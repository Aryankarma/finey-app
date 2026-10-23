import type { Debt } from '@/data/seed';
import { isSettled, kindLabels, paidSoFar, remaining } from '@/store/debts';
import { dayOfMonth, formatMoney, monthName } from '@/ui/format';

// The sentences People, Record a payment and Edit a record use to describe a debt.

const day = (iso: string) => `${dayOfMonth(iso)} ${monthName(iso, 'short')}`;
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const theyOwe = (d: Debt) => d.direction === 'theyOweMe';

// "Loan you gave on 2 Oct", "Her share of the Goa stay", "You borrowed for concert tickets"
export function describe(d: Debt): string {
  const note = d.note.trim();
  if (note) {
    if (!theyOwe(d) && d.kind === 'loan') return `You borrowed for ${lowerFirst(note)}`;
    return upperFirst(note);
  }
  const on = day(d.date);
  if (theyOwe(d)) {
    return { loan: `Loan you gave on ${on}`, shared: `Their share, from ${on}`, payment: `You paid for them on ${on}`, other: `Since ${on}` }[d.kind];
  }
  return { loan: `You borrowed on ${on}`, shared: `Your share, from ${on}`, payment: `They paid for you on ${on}`, other: `Since ${on}` }[d.kind];
}

// The small line under the amount: "left of ₹1,000", "nothing back yet", "you owe", "settled up"
export function statusLine(d: Debt): string {
  if (isSettled(d)) return 'settled up';
  if (paidSoFar(d) > 0) return `left of ${formatMoney(d.amount)}`;
  return theyOwe(d) ? 'nothing back yet' : 'you owe';
}

// What's been paid back so far, with its amount.
export function historyLine(d: Debt): { text: string; amount?: number } {
  const n = d.payments.length;
  if (n === 0) return { text: theyOwe(d) ? 'No payments yet' : "You haven't paid anything back yet" };
  if (n > 1) return { text: `${theyOwe(d) ? 'Paid back' : 'You paid back'} over ${n} payments`, amount: paidSoFar(d) };
  const p = d.payments[0];
  const by = p.method ? ` by ${p.method}` : '';
  return { text: `${theyOwe(d) ? 'Paid back' : 'You paid back'}${by} on ${day(p.date)}`, amount: p.amount };
}

export const actionLabel = (d: Debt) => (theyOwe(d) ? 'Record payment' : 'Record what you paid');

// "Owes you ₹750 of ₹1,000" / "You owe ₹750 of ₹1,000"
export function summaryLine(d: Debt): string {
  const left = formatMoney(remaining(d));
  return theyOwe(d) ? `Owes you ${left} of ${formatMoney(d.amount)}` : `You owe ${left} of ${formatMoney(d.amount)}`;
}

export const kindNoun = (d: Debt) => lowerFirst(kindLabels[d.kind]);

// A typed note like "paid by UPI" becomes the method "UPI".
export const methodFromNote = (note: string) => note.trim().replace(/^(paid\s+)?(by|via)\s+/i, '') || undefined;
