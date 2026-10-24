import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { DrawnCheck } from '@/components/drawn-check';
import { PrimaryButton } from '@/components/primary-button';
import { Sheet } from '@/components/sheet';
import { useAccent } from '@/hooks/use-accent';
import { useEntries } from '@/store/entries';
import { buildCsv, saveCsv, shareCsv } from '@/store/export';
import { countLabel, isDefaultFilters, ledgerEntries, sortLabels, useLedger } from '@/store/ledger';
import { inMonth } from '@/store/summary';
import { useViewDay } from '@/store/view-month';
import { monthName } from '@/ui/format';
import { Icon } from '@/ui/icons';
import { colors, fonts, tabular } from '@/ui/theme';

type Scope = 'all' | 'filtered';
type Phase = 'idle' | 'busy' | 'ready';
const PREPARE_MS = 1400;

// Export the shown month as CSV: everything, or only what the Ledger is filtered to.
export function ExportSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const accent = useAccent();
  const entries = useEntries((s) => s.entries);
  const ledger = useLedger();
  const viewDay = useViewDay();
  const month = monthName(viewDay);
  const filters = { show: ledger.show, savedOnly: ledger.savedOnly, sort: ledger.sort };
  const hasFilter = !isDefaultFilters(filters) || ledger.query.trim() !== '';

  const all = useMemo(() => inMonth(entries, viewDay), [entries, viewDay]);
  const filtered = useMemo(
    () => ledgerEntries(entries, viewDay, { show: ledger.show, savedOnly: ledger.savedOnly, sort: ledger.sort }, ledger.query),
    [entries, viewDay, ledger.show, ledger.savedOnly, ledger.sort, ledger.query],
  );

  const [scope, setScope] = useState<Scope>('all');
  const [phase, setPhase] = useState<Phase>('idle');
  const [saved, setSaved] = useState(false);
  const [shareNote, setShareNote] = useState('');
  const progress = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (visible) {
      setScope(hasFilter ? 'filtered' : 'all');
      setPhase('idle');
      setSaved(false);
      setShareNote('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const rows = scope === 'all' ? all : filtered;
  const slug = `${monthName(viewDay, 'short').toLowerCase()}-${viewDay.slice(0, 4)}`;
  const suffix = scope === 'all' ? '' : ledger.show === 'expense' ? '-expenses' : ledger.show === 'income' ? '-income' : '-filtered';
  const fileName = `finey-${slug}${suffix}.csv`;
  const csv = useMemo(() => buildCsv(rows), [rows]);
  const kb = Math.max(1, Math.round(csv.length / 1024));
  const rowsText = `${rows.length} ${rows.length === 1 ? 'row' : 'rows'}`;
  const filteredLabel = `${countLabel(filtered.length, filters)}, ${sortLabels[ledger.sort].toLowerCase()}`;

  const start = () => {
    if (phase !== 'idle' || rows.length === 0) return;
    setPhase('busy');
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 1300, easing: Easing.bezier(0.5, 0, 0.2, 1), useNativeDriver: false }).start();
    timer.current = setTimeout(() => setPhase('ready'), PREPARE_MS);
  };

  const close = () => phase !== 'busy' && onClose();

  return (
    <Sheet visible={visible} onClose={close}>
      {phase === 'ready' ? (
        <View style={styles.ready} role="status">
          <DrawnCheck />
          <Text style={styles.readyTitle}>Your file is ready</Text>
          <View style={styles.fileCard}>
            <View style={styles.fileBadge}>
              <Text style={styles.fileBadgeText}>CSV</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
              <Text style={styles.small}>{`${rowsText}, ${kb} KB`}</Text>
            </View>
          </View>
          {shareNote !== '' && <Text style={[styles.shareNote, { color: accent.lilacSoft }]} role="status">{shareNote}</Text>}
          <View style={styles.readyActions}>
            <Pressable
              disabled={saved}
              onPress={() => saveCsv(fileName, csv).then(() => setSaved(true))}
              style={({ pressed }) => [styles.secondary, pressed && { transform: [{ scale: 0.98 }] }]}>
              {saved && <Icon name="check" size={16} color={colors.mint} strokeWidth={2.2} />}
              <Text style={[styles.secondaryLabel, saved && { color: colors.mint }]}>{saved ? 'Saved to Downloads' : 'Save to Downloads'}</Text>
            </Pressable>
            <PrimaryButton
              label="Share file"
              icon="share"
              height={54}
              onPress={() =>
                shareCsv(fileName, csv).then((shared) =>
                  setShareNote(shared ? 'Pick an app in the share menu to send it.' : 'Sharing isn’t available here. Save the file instead.'),
                )
              }
              style={{ flex: 1 }}
            />
          </View>
          <Pressable onPress={onClose} style={styles.done}>
            <Text style={styles.doneLabel}>Done</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.top}>
            <View style={styles.badge}>
              <Icon name="table" size={22} color={colors.mint} />
            </View>
            <Pressable onPress={close} accessibilityLabel="Close" style={({ pressed }) => [styles.close, pressed && { transform: [{ scale: 0.94 }] }]}>
              <Icon name="close" size={18} color={colors.text} strokeWidth={1.9} />
            </Pressable>
          </View>
          <Text style={styles.title} role="heading">Export {month}</Text>
          <Text style={styles.sub}>Pick what goes into the file.</Text>

          <View style={{ gap: 10 }} role="radiogroup" aria-label="What to export">
            <Option
              on={scope === 'all'}
              disabled={phase === 'busy'}
              title={`Everything in ${month}`}
              sub={`${countLabel(all.length, { show: 'all', savedOnly: false, sort: 'newest' })}, money in and out`}
              onPress={() => setScope('all')}
            />
            <Option
              on={scope === 'filtered'}
              disabled={phase === 'busy' || !hasFilter}
              title="Only what you've filtered"
              sub={hasFilter ? filteredLabel : 'No filters on in the Ledger right now'}
              onPress={() => setScope('filtered')}
            />
          </View>

          <View style={styles.infoRow}>
            <Icon name="info" size={16} color={colors.textFaint} />
            <Text style={styles.small}>Saved as a CSV file that opens in any spreadsheet app.</Text>
          </View>

          <View style={styles.action}>
            {phase === 'idle' ? (
              <PrimaryButton
                label={rows.length === 0 ? 'Nothing to export' : `Export ${countLabel(rows.length, scope === 'all' ? { show: 'all', savedOnly: false, sort: 'newest' } : filters)}`}
                icon="download"
                disabled={rows.length === 0}
                onPress={start}
              />
            ) : (
              <View style={styles.progressWrap} role="status">
                <View style={styles.progressHead}>
                  <Text style={styles.preparing} numberOfLines={1}>Preparing {fileName}</Text>
                  <Text style={styles.small}>{rowsText}</Text>
                </View>
                <View style={styles.track}>
                  <Animated.View style={{ height: 8, width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}>
                    <LinearGradient colors={[accent.primary[0], accent.lilac]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fill} />
                  </Animated.View>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </Sheet>
  );
}

function Option({ on, disabled, title, sub, onPress }: { on: boolean; disabled: boolean; title: string; sub: string; onPress: () => void }) {
  const accent = useAccent();
  return (
    <Pressable
      role="radio"
      aria-checked={on}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        on && [styles.optionOn, { backgroundColor: `rgba(${accent.rgb},0.12)`, borderColor: accent.iris }],
        disabled && !on && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.99 }] },
      ]}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.small}>{sub}</Text>
      </View>
      <View style={[styles.ring, on && { borderColor: accent.iris }]}>{on && <View style={[styles.ringDot, { backgroundColor: accent.lilac }]} />}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 4 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -2 },
  badge: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.mintTint, alignItems: 'center', justifyContent: 'center' },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 16, fontFamily: fonts.expandedSemibold, fontSize: 22, color: colors.text },
  sub: { marginTop: 6, marginBottom: 18, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.textMuted },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#18181C',
    borderWidth: 1,
    borderColor: colors.surface4,
  },
  optionOn: { borderWidth: 1.5, padding: 15.5 },
  optionTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  small: { fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint, ...tabular },
  ring: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#4A4A54', alignItems: 'center', justifyContent: 'center' },
  ringDot: { width: 10, height: 10, borderRadius: 5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginHorizontal: 2 },
  action: { marginTop: 20, minHeight: 56, justifyContent: 'center' },
  progressWrap: { gap: 10, paddingTop: 6 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  preparing: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 14, color: '#D9D9DE' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.surface4, overflow: 'hidden' },
  fill: { flex: 1, borderRadius: 4 },
  ready: { alignItems: 'center', paddingHorizontal: 4 },
  readyTitle: { marginTop: 14, fontFamily: fonts.expandedSemibold, fontSize: 22, color: colors.text },
  fileCard: {
    alignSelf: 'stretch',
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#18181C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  fileBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.mintTint, alignItems: 'center', justifyContent: 'center' },
  fileBadgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.mint },
  fileName: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  shareNote: { marginTop: 12, fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' },
  readyActions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 18 },
  secondary: { flex: 1, height: 54, borderRadius: 27, backgroundColor: colors.surface3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  done: { marginTop: 8, height: 44, paddingHorizontal: 16, justifyContent: 'center' },
  doneLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
});
