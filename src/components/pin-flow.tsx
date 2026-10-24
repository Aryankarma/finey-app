import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DrawnCheck } from '@/components/drawn-check';
import { PinDots } from '@/components/pin-dots';
import { PinPad } from '@/components/pin-pad';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { useAccent } from '@/hooks/use-accent';
import { getPin, isWeakPin, setPin } from '@/store/pin';
import { Icon, type IconName } from '@/ui/icons';
import { colors, fonts, layout, space, type } from '@/ui/theme';

type Step = 'current' | 'new' | 'confirm' | 'done';

const MAX_TRIES = 3;
const LOCK_SECONDS = 30;

const STEPS: Record<Exclude<Step, 'done'>, { title: string; sub: string; icon: IconName }> = {
  current: { title: 'Enter your current PIN', sub: 'The one you use to show amounts on Home.', icon: 'lock' },
  new: { title: 'Choose a new PIN', sub: 'Use 4 to 6 digits that would be hard to guess.', icon: 'key' },
  confirm: { title: 'Enter it again', sub: 'Type the same PIN once more to confirm it.', icon: 'lockCheck' },
};

// What changes between changing a PIN from Settings and setting the first one when Finey opens.
const MODES = {
  change: {
    title: 'Change PIN',
    steps: ['current', 'new', 'confirm'] as Exclude<Step, 'done'>[],
    newCopy: STEPS.new,
    doneTitle: 'PIN changed',
    doneSub: 'Use your new PIN next time you show amounts.',
    doneLabel: 'Done',
  },
  setup: {
    title: 'Welcome to Finey',
    steps: ['new', 'confirm'] as Exclude<Step, 'done'>[],
    newCopy: { title: 'Choose a PIN', sub: 'Finey can hide your amounts. This PIN shows them again. Use 4 to 6 digits.', icon: 'key' as IconName },
    doneTitle: 'PIN set',
    doneSub: 'Your PIN stays on this phone. You can change it any time in Settings.',
    doneLabel: 'Start using Finey',
  },
};

// Change PIN: current PIN (3 wrong tries means a 30 second wait), new PIN of 4 to 6 digits, then confirm.
// Setup skips the current PIN and has no way back, since Finey needs a PIN before it opens.
export function PinFlow({ mode, onBack, onDone }: { mode: keyof typeof MODES; onBack?: () => void; onDone: () => void }) {
  const accent = useAccent();
  const m = MODES[mode];
  const [currentPin, setCurrentPin] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(m.steps[0]);
  const [entry, setEntry] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');
  const [wrong, setWrong] = useState(false);
  const [shake, setShake] = useState(0);
  const [tries, setTries] = useState(0);
  const [lockLeft, setLockLeft] = useState(0);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (mode === 'change') getPin().then(setCurrentPin);
    return () => clearTimeout(timer.current);
  }, [mode]);

  // Count down the wait after too many wrong tries.
  useEffect(() => {
    if (lockLeft <= 0) return;
    const t = setTimeout(() => {
      setLockLeft(lockLeft - 1);
      if (lockLeft === 1) setError('');
    }, 1000);
    return () => clearTimeout(t);
  }, [lockLeft]);

  // Show the wrong digits in pink, shake, then clear.
  const fail = (message: string) => {
    busy.current = true;
    setError(message);
    setWrong(true);
    setShake((n) => n + 1);
    timer.current = setTimeout(() => {
      setEntry('');
      setWrong(false);
      busy.current = false;
    }, 480);
  };

  const advance = (next: Step) => {
    setEntry('');
    setError('');
    setWrong(false);
    busy.current = false;
    setStep(next);
  };

  const press = (d: string) => {
    if (busy.current || lockLeft > 0 || (step === 'current' && currentPin === null)) return;
    const max = step === 'current' ? (currentPin?.length ?? 0) : step === 'new' ? 6 : newPin.length;
    if (entry.length >= max) return;
    const e = entry + d;
    setEntry(e);
    setError('');
    if (e.length < max) return;
    if (step === 'current') {
      busy.current = true;
      timer.current = setTimeout(() => {
        if (e === currentPin) {
          setTries(0);
          advance('new');
          return;
        }
        const n = tries + 1;
        if (n >= MAX_TRIES) {
          setTries(0);
          fail('Three wrong tries in a row. Wait 30 seconds, then try again.');
          setLockLeft(LOCK_SECONDS);
        } else {
          setTries(n);
          const left = MAX_TRIES - n;
          fail(`That isn't your current PIN. ${left} ${left === 1 ? 'try' : 'tries'} left before a short wait.`);
        }
      }, 220);
    }
    if (step === 'confirm') {
      busy.current = true;
      timer.current = setTimeout(() => {
        if (e === newPin) {
          setPin(newPin).then(() => advance('done'));
        } else {
          fail("Those PINs don't match. Try again.");
        }
      }, 220);
    }
  };

  const confirmNew = () => {
    if (entry.length < 4 || busy.current) return;
    if (entry === currentPin) return fail("Your new PIN can't be the same as the current one.");
    if (isWeakPin(entry)) return fail('That PIN is easy to guess. Try a less obvious one.');
    setNewPin(entry);
    advance('confirm');
  };

  const total = m.steps.length;
  const stepNum = step === 'done' ? total : m.steps.indexOf(step) + 1;
  const copy = step === 'new' ? m.newCopy : step === 'done' ? null : STEPS[step];
  const dots = step === 'current' ? (currentPin?.length ?? 5) : step === 'new' ? Math.max(4, Math.min(6, entry.length + 1)) : newPin.length;
  const message = lockLeft > 0 ? `Three wrong tries in a row. Try again in ${lockLeft}s.` : error;

  return (
    <Screen bottom>
      <View style={styles.header}>
        {onBack && (
          <Pressable onPress={onBack} accessibilityLabel="Back to Settings" style={({ pressed }) => [styles.iconButton, pressed && { transform: [{ scale: 0.94 }] }]}>
            <Icon name="back" size={18} color={colors.text} strokeWidth={1.9} />
          </Pressable>
        )}
        <Text style={styles.title} role="heading">{m.title}</Text>
      </View>

      <View style={styles.progress} role="progressbar" aria-label={`Step ${stepNum} of ${total}`}>
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <View key={n} style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: n <= stepNum ? '100%' : '0%', backgroundColor: accent.iris }]} />
          </View>
        ))}
      </View>

      {step === 'done' ? (
        <>
          <View style={styles.middle} role="status">
            <DrawnCheck size={88} />
            <Text style={[styles.stepTitle, { fontSize: 24, marginTop: 22 }]}>{m.doneTitle}</Text>
            <Text style={styles.stepSub}>{m.doneSub}</Text>
          </View>
          <View style={styles.footer}>
            <PrimaryButton label={m.doneLabel} onPress={onDone} />
          </View>
        </>
      ) : (
        <>
          <View style={styles.middle}>
            <View style={[styles.badge, { backgroundColor: `rgba(${accent.rgb},0.16)` }]}>
              <Icon name={copy!.icon} size={26} color={accent.lilac} />
            </View>
            <Text style={styles.stepTitle}>{copy!.title}</Text>
            <Text style={styles.stepSub}>{copy!.sub}</Text>
            <View style={{ marginTop: 32 }}>
              <PinDots count={dots} filled={entry.length} wrong={wrong} shake={shake} />
            </View>
            <View style={styles.errorSlot} aria-live="assertive">
              {message !== '' && <Text style={styles.error}>{message}</Text>}
            </View>
          </View>

          <View style={styles.pad}>
            <PinPad onDigit={press} onBackspace={() => !busy.current && setEntry(entry.slice(0, -1))} disabled={lockLeft > 0} />
          </View>

          <View style={styles.footer}>
            {step === 'new' && (
              <PrimaryButton label={entry.length < 4 ? 'Enter at least 4 digits' : 'Continue'} disabled={entry.length < 4} onPress={confirmNew} />
            )}
            {step === 'confirm' && (
              <Pressable onPress={() => { setNewPin(''); advance('new'); }} style={styles.secondary}>
                <Text style={styles.secondaryLabel}>Choose a different PIN</Text>
              </Pressable>
            )}
            {step === 'current' && <Text style={styles.footnote}>Your PIN never leaves this phone.</Text>}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { height: layout.headerHeight, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: space.screenX },
  iconButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: layout.iconButton / 2,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.pageTitle, color: colors.text },
  progress: { flexDirection: 'row', gap: 6, paddingTop: 8, paddingHorizontal: space.screenX },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surface4, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  badge: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { marginTop: 20, fontFamily: fonts.expandedSemibold, fontSize: 22, color: colors.text, textAlign: 'center' },
  stepSub: { marginTop: 8, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textMuted, textAlign: 'center' },
  errorSlot: { minHeight: 44, marginTop: 16 },
  error: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.rose, textAlign: 'center' },
  pad: { paddingHorizontal: 36 },
  footer: { minHeight: 56, paddingTop: 14, paddingHorizontal: space.screenX, paddingBottom: space.xxl, justifyContent: 'center' },
  secondary: { height: 56, borderRadius: 28, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  secondaryLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  footnote: { height: 56, lineHeight: 56, textAlign: 'center', fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
});
