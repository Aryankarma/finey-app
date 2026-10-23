// Money and date formatting shared by every screen.

const MINUS = '−';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Indian digit grouping: 1,24,500.
export function groupIndian(n: number): string {
  const s = String(Math.round(Math.abs(n)));
  if (s.length <= 3) return s;
  const head = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${s.slice(-3)}`;
}

// ₹56,260. With `signed`, always shows + or −.
export function formatMoney(n: number, { signed = false } = {}): string {
  const body = `₹${groupIndian(n)}`;
  if (n < 0) return MINUS + body;
  return signed ? `+${body}` : body;
}

// ₹14.4k for chart labels.
export function formatCompact(n: number): string {
  if (Math.abs(n) < 1000) return `₹${Math.round(n)}`;
  return `₹${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
}

function parseDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function dayOfMonth(iso: string): number {
  return Number(iso.slice(8, 10));
}

export function daysInMonth(iso: string): number {
  const [y, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function monthName(iso: string, style: 'long' | 'short' = 'long'): string {
  const m = Number(iso.slice(5, 7)) - 1;
  if (style === 'short') return MONTHS[m];
  return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m];
}

// Today, Yesterday, or 14 Oct.
export function relativeDay(iso: string, today: string): string {
  const diff = Math.round((parseDay(today) - parseDay(iso)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${dayOfMonth(iso)} ${monthName(iso, 'short')}`;
}
