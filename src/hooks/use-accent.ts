import { useSettings } from '@/store/settings';
import { accents, type Accent } from '@/ui/theme';

// The accent colour picked in Settings. Use its fields in place of colors.iris, colors.lilac,
// colors.lilacSoft, colors.irisTint and gradients.primary.
export function useAccent(): Accent {
  return accents[useSettings((s) => s.accent)] ?? accents.iris;
}
