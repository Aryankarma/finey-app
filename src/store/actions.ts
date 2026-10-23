import { useEntries } from '@/store/entries';
import { useToast } from '@/store/toast';

// Delete an entry and offer to put it back from the toast.
export function deleteEntryWithUndo(id: string) {
  const removed = useEntries.getState().removeEntry(id);
  if (!removed) return;
  useToast.getState().show(`${removed.entry.name} deleted`, {
    label: 'Undo',
    onPress: () => useEntries.getState().restoreEntry(removed),
  });
}
