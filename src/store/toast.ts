import { create } from 'zustand';

// One toast at a time, shown above the tab bar, e.g. "Headphones deleted · Undo".
type Toast = { id: number; message: string; actionLabel?: string; onAction?: () => void };

type ToastState = {
  toast: Toast | null;
  show: (message: string, action?: { label: string; onPress: () => void }) => void;
  hide: () => void;
};

const DURATION = 5000;
let timer: ReturnType<typeof setTimeout> | undefined;

export const useToast = create<ToastState>()((set) => ({
  toast: null,
  show: (message, action) => {
    clearTimeout(timer);
    set({ toast: { id: Date.now(), message, actionLabel: action?.label, onAction: action?.onPress } });
    timer = setTimeout(() => set({ toast: null }), DURATION);
  },
  hide: () => {
    clearTimeout(timer);
    set({ toast: null });
  },
}));
