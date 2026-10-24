import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { Entry } from '@/data/seed';
import { categories } from '@/ui/categories';

// CSV export of ledger entries: build the text, then save or share it.

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildCsv(entries: Entry[]): string {
  const rows = [['Date', 'Description', 'Category', 'Type', 'Amount', 'Saved']];
  for (const e of entries) {
    rows.push([e.date, e.name, categories[e.category].label, e.type === 'income' ? 'Income' : 'Expense', String(e.type === 'income' ? e.amount : -e.amount), e.saved ? 'Yes' : '']);
  }
  return rows.map((r) => r.map(cell).join(',')).join('\n') + '\n';
}

// Web: download the file. Phone: write it to the cache and open the share sheet, where "Save to Files" lives.
export async function saveCsv(fileName: string, csv: string): Promise<void> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  await shareFile(fileName, csv);
}

// Returns false when there is no share sheet to open (most desktop browsers).
export async function shareCsv(fileName: string, csv: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    const file = new globalThis.File([csv], fileName, { type: 'text/csv' });
    if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: fileName }).catch(() => undefined);
      return true;
    }
    return false;
  }
  await shareFile(fileName, csv);
  return true;
}

async function shareFile(fileName: string, csv: string) {
  const file = new File(Paths.cache, fileName);
  await file.write(csv);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: fileName, UTI: 'public.comma-separated-values-text' });
  }
}
