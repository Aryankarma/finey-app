import { create } from 'zustand';

import { currentDay } from '@/store/entries';
import { daysInMonth } from '@/ui/format';

// The month Home, Ledger and Spending are showing. Shared, so picking September anywhere shows it everywhere.
type ViewMonthState = {
  month: string | null; // 'YYYY-MM'; null means the current month
  setMonth: (month: string | null) => void;
};

export const useViewMonth = create<ViewMonthState>()((set) => ({
  month: null,
  setMonth: (month) => set({ month: month === currentDay().slice(0, 7) ? null : month }),
}));

// Last day being looked at: today in the current month, else that month's last day.
// Screens pass it to the summary functions; "Today" labels still use currentDay().
export function useViewDay(): string {
  const month = useViewMonth((s) => s.month);
  if (!month) return currentDay();
  return `${month}-${String(daysInMonth(`${month}-01`)).padStart(2, '0')}`;
}

export const useIsCurrentMonth = () => useViewMonth((s) => s.month === null);
