import type { CategoryKey, Entry } from '@/data/seed';
import { addDays, weekday } from '@/ui/format';

// Turns typed or spoken text into draft entries for Paste text and Voice entry.

export type ParsedEntry = {
  name: string;
  amount: number; // 0 when no amount was found
  type: Entry['type'];
  category: CategoryKey;
  date: string;
  duplicateOf?: Entry; // an existing entry with the same amount on the same day
};

const KEYWORDS: [CategoryKey, string[]][] = [
  ['food', ['lunch', 'dinner', 'breakfast', 'swiggy', 'zomato', 'grocer', 'chai', 'coffee', 'café', 'cafe', 'snack', 'bigbasket', 'food', 'restaurant', 'pizza', 'bakery', 'dmart', 'blinkit', 'zepto', 'tea']],
  ['transport', ['uber', 'ola', 'auto', 'cab', 'metro', 'bus', 'train', 'fuel', 'petrol', 'diesel', 'rapido', 'station', 'parking', 'toll', 'flight']],
  ['utilities', ['electric', 'water', 'gas', 'internet', 'wifi', 'wi-fi', 'broadband', 'recharge', 'bill', 'maintenance', 'rent']],
  ['shopping', ['amazon', 'flipkart', 'myntra', 'shoe', 'shirt', 'headphone', 'clothes', 'dress', 'kurta', 'shopping', 'phone case']],
  ['entertainment', ['movie', 'netflix', 'concert', 'spotify', 'game', 'show', 'bowling', 'prime']],
  ['health', ['gym', 'doctor', 'medicine', 'pharmacy', 'clinic', 'dental', 'vitamin', 'hospital']],
  ['education', ['course', 'book', 'udemy', 'class', 'tuition', 'school', 'college']],
];

const INCOME = /\b(salary|received|refund|freelance|income|got paid|bonus|came in|credited|dividend)\b/i;
const AMOUNT = /(?:₹\s*|\brs\.?\s*|\binr\s*)?(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|lakh|lakhs)?\b/i;
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DATE_WORDS = /\b(today|yesterday|day before yesterday|last (?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)|(?:on )?(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday))\b/i;

// Matches for highlighting a transcript: amounts and dates, in order.
export const HIGHLIGHT = new RegExp(`${AMOUNT.source}|${DATE_WORDS.source}`, 'gi');

function amountOf(text: string): { amount: number; match: string } | null {
  const m = text.match(AMOUNT);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/,/g, ''));
  const unit = m[2]?.toLowerCase();
  if (unit === 'k' || unit === 'thousand') n *= 1000;
  if (unit === 'lakh' || unit === 'lakhs') n *= 100000;
  return { amount: Math.round(n), match: m[0] };
}

// "yesterday" → yesterday; "Saturday" → the most recent Saturday on or before today.
function dateOf(text: string, today: string): string | null {
  const low = text.toLowerCase();
  if (/\bday before yesterday\b/.test(low)) return addDays(today, -2);
  if (/\byesterday\b/.test(low)) return addDays(today, -1);
  if (/\btoday\b/.test(low)) return today;
  const day = DAYS.find((d) => new RegExp(`\\b${d}\\b`).test(low));
  if (!day) return null;
  const now = DAYS.indexOf(weekday(today).toLowerCase());
  const back = (now - DAYS.indexOf(day) + 7) % 7;
  return addDays(today, -back);
}

function categoryOf(text: string, income: boolean): CategoryKey {
  const low = text.toLowerCase();
  if (income) {
    if (/\bsalary\b/.test(low)) return 'salary';
    if (/\bfreelance\b/.test(low)) return 'freelance';
    if (/\bbonus\b/.test(low)) return 'bonus';
    if (/\bdividend\b/.test(low)) return 'investment';
    return 'other';
  }
  return KEYWORDS.find(([, words]) => words.some((w) => low.includes(w)))?.[0] ?? 'other';
}

// What's left once the amount, date and filler words are taken out: "Spent 450 on groceries yesterday" → "Groceries".
function nameOf(text: string, amountMatch: string | undefined): string {
  let s = amountMatch ? text.replace(amountMatch, ' ') : text;
  s = s.replace(DATE_WORDS, ' ').replace(/\b(rupees|inr|rs)\b|₹/gi, ' ').replace(/\b(came in|got paid)\b/gi, ' ');
  const words = s.split(/\s+/).filter(Boolean);
  const lead = /^(spent|paid|gave|bought|got|received|the|a|an|and|on|for|of|my)$/i;
  const tail = /^(on|for|to|at|of|the|a|an|and|was|is|received|paid|credited)$/i;
  while (words.length && lead.test(words[0])) words.shift();
  while (words.length && tail.test(words[words.length - 1])) words.pop();
  const name = words.join(' ').replace(/[.,;:]+$/, '');
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Untitled entry';
}

function build(text: string, date: string, existing: Entry[]): ParsedEntry {
  const found = amountOf(text);
  const amount = found?.amount ?? 0;
  const type: Entry['type'] = INCOME.test(text) ? 'income' : 'expense';
  const duplicateOf = amount > 0 ? existing.find((e) => e.amount === amount && e.date === date && e.type === type) : undefined;
  return { name: nameOf(text, found?.match), amount, type, category: categoryOf(text, type === 'income'), date, duplicateOf };
}

// Paste text: one entry per line, dated today unless the line says otherwise.
export function parseLine(line: string, today: string, existing: Entry[]): ParsedEntry {
  return build(line, dateOf(line, today) ?? today, existing);
}

// Voice: one sentence with several entries. Split on commas into groups, then on "and" within a group.
// An item without its own date takes its group's date ("Uber 120 and a movie for 800 on Saturday").
export function parseSpeech(transcript: string, today: string, existing: Entry[]): ParsedEntry[] {
  const out: ParsedEntry[] = [];
  // A comma followed by a digit is part of a number ("50,000"), not a break.
  for (const group of transcript.split(/,(?!\d)|;|\.\s+/)) {
    const parts = group.split(/\band\b|\bthen\b|\bplus\b/i).map((p) => p.trim()).filter(Boolean);
    const groupDate = dateOf(group, today) ?? today;
    // Parts without an amount ("came in today") belong to the part before them.
    const items: string[] = [];
    for (const p of parts) {
      if (amountOf(p) || items.length === 0) items.push(p);
      else items[items.length - 1] += ` ${p}`;
    }
    for (const item of items) {
      if (!amountOf(item)) continue;
      out.push(build(item, dateOf(item, today) ?? groupDate, existing));
    }
  }
  return out;
}
