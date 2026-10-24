import { create } from 'zustand';

// Text typed into Home's quick-add box, handed to Paste text. Passed through app state
// rather than the URL so what you typed never lands in browser history.
type PasteHandoff = { text: string | null; give: (text: string) => void; take: () => string | null };

export const usePasteHandoff = create<PasteHandoff>()((set, get) => ({
  text: null,
  give: (text) => set({ text }),
  take: () => {
    const text = get().text;
    set({ text: null });
    return text;
  },
}));
