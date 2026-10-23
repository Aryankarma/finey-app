import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

// "Hide amounts" from the eye button on Home. Every Amount reads this.
type Privacy = { hidden: boolean; toggle: () => void };

const PrivacyContext = createContext<Privacy>({ hidden: false, toggle: () => {} });

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const value = useMemo(() => ({ hidden, toggle: () => setHidden((h) => !h) }), [hidden]);
  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}
