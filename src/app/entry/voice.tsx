import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormHeader } from '@/components/entry-form';
import { ParsedEditSheet } from '@/components/parsed-edit-sheet';
import { ParsedRow } from '@/components/parsed-row';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { useAccent } from '@/hooks/use-accent';
import { currentDay, useEntries } from '@/store/entries';
import { HIGHLIGHT, parseSpeech, type ParsedEntry } from '@/store/parse-entries';
import { useToast } from '@/store/toast';
import { startWebRecording, stopWebRecording } from '@/store/web-recording';
import { Icon } from '@/ui/icons';
import { colors, fonts, space, tabular } from '@/ui/theme';

type Phase = 'listening' | 'processing' | 'review' | 'unavailable';
const MAX_SECONDS = 60;
const nativeDriver = Platform.OS !== 'web';

// Voice entry: listen, then review what was heard with amounts and dates marked, untick wrong rows, save.
export default function VoiceScreen() {
  const router = useRouter();
  const entries = useEntries((s) => s.entries);
  const addEntry = useEntries((s) => s.addEntry);
  const showToast = useToast((s) => s.show);
  const today = currentDay();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const [phase, setPhase] = useState<Phase>('listening');
  const [unavailableReason, setUnavailableReason] = useState('');
  const [heard, setHeard] = useState(''); // live transcript while listening
  const [transcript, setTranscript] = useState('');
  const [rows, setRows] = useState<ParsedEntry[]>([]);
  const [ticks, setTicks] = useState<boolean[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [editing, setEditing] = useState<number | null>(null);
  const [recording, setRecording] = useState<{ uri: string; seconds: number } | null>(null);
  const accent = useAccent();
  const finals = useRef(''); // finished phrases so far
  const startedAt = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const player = useAudioPlayer(null);
  const playback = useAudioPlayerStatus(player);
  useEffect(() => {
    if (recording) player.replace({ uri: recording.uri });
  }, [recording, player]);
  const playOrPause = () => {
    if (playback.playing) return player.pause();
    if (playback.didJustFinish || playback.currentTime >= playback.duration - 0.05) player.seekTo(0);
    player.play();
  };
  const heardFor = () => Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));

  const finish = (text: string) => {
    setPhase('processing');
    if (Platform.OS === 'web') {
      const length = heardFor();
      stopWebRecording().then((uri) => uri && setRecording({ uri, seconds: length }));
    }
    setTimeout(() => {
      const parsed = parseSpeech(text, today, entries);
      setTranscript(text);
      setRows(parsed);
      setTicks(parsed.map((r) => r.amount > 0 && !r.duplicateOf));
      setPhase('review');
    }, 900);
  };

  useSpeechRecognitionEvent('result', (e) => {
    const text = e.results[0]?.transcript ?? '';
    if (e.isFinal) {
      finals.current = `${finals.current} ${text}`.trim();
      setHeard(finals.current);
    } else {
      setHeard(`${finals.current} ${text}`.trim());
    }
  });
  // On phones the recogniser saves what it heard to a file we can play back.
  useSpeechRecognitionEvent('audioend', (e) => {
    if (e.uri) setRecording({ uri: e.uri, seconds: heardFor() });
  });
  useSpeechRecognitionEvent('end', () => {
    if (phaseRef.current === 'listening' || phaseRef.current === 'processing') finish(finals.current);
  });
  useSpeechRecognitionEvent('error', (e) => {
    if (e.error === 'aborted') return;
    if (e.error === 'no-speech') return finish('');
    setUnavailableReason(e.error === 'not-allowed' ? 'Finey needs the microphone to hear you. Allow it in your settings, or type instead.' : `Voice entry stopped (${e.error}). You can try again or type instead.`);
    setPhase('unavailable');
  });

  const listen = async () => {
    finals.current = '';
    setHeard('');
    setSeconds(0);
    player.pause();
    if (recording && Platform.OS === 'web') URL.revokeObjectURL(recording.uri);
    setRecording(null);
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      setUnavailableReason("Voice entry isn't available on this device or browser. You can type your entries instead.");
      setPhase('unavailable');
      return;
    }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setUnavailableReason('Finey needs the microphone to hear you. Allow it in your settings, or type instead.');
      setPhase('unavailable');
      return;
    }
    setPhase('listening');
    startedAt.current = Date.now();
    ExpoSpeechRecognitionModule.start({
      lang: 'en-IN',
      interimResults: true,
      continuous: true,
      recordingOptions: { persist: Platform.OS !== 'web' },
    });
    if (Platform.OS === 'web') startWebRecording();
  };

  const stop = () => {
    setPhase('processing');
    ExpoSpeechRecognitionModule.stop(); // the 'end' event parses what was heard
  };

  useEffect(() => {
    listen();
    return () => {
      ExpoSpeechRecognitionModule.abort();
      stopWebRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listening timer; stops by itself at one minute.
  useEffect(() => {
    if (phase !== 'listening') return;
    if (seconds >= MAX_SECONDS) {
      stop();
      return;
    }
    const t = setTimeout(() => setSeconds(seconds + 1), 1000);
    return () => clearTimeout(t);
  }, [phase, seconds]);

  const ticked = rows.filter((_, i) => ticks[i]);

  const save = () => {
    for (const r of ticked) addEntry({ name: r.name, amount: r.amount, type: r.type, category: r.category, date: r.date, source: 'voice' });
    close();
    showToast(ticked.length === 1 ? '1 entry saved' : `${ticked.length} entries saved`);
  };

  return (
    <Screen bottom>
      <FormHeader
        title="Voice entry"
        onClose={close}
        right={
          phase === 'review' && recording ? (
            <Pressable
              onPress={playOrPause}
              accessibilityRole="button"
              accessibilityLabel={playback.playing ? 'Pause the recording' : `Play the recording, ${recording.seconds} seconds`}
              style={({ pressed }) => [styles.play, pressed && { transform: [{ scale: 0.96 }] }]}>
              <Icon name={playback.playing ? 'pause' : 'play'} size={14} color={accent.lilac} fill={accent.lilac} strokeWidth={0} />
              <Text style={styles.playTime}>
                {clock(playback.playing ? Math.max(0, Math.ceil((playback.duration || recording.seconds) - playback.currentTime)) : recording.seconds)}
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      {phase === 'listening' && (
        <View style={styles.center} aria-live="polite">
          <Wave />
          <View style={{ gap: 6, alignItems: 'center' }}>
            <Text style={styles.bigTitle}>Listening</Text>
            <Text style={styles.timer}>0:{String(seconds).padStart(2, '0')} of 1:00</Text>
          </View>
          <Text style={styles.copy}>{heard || 'Say what you spent or earned, with amounts and days. You can list several at once.'}</Text>
        </View>
      )}

      {phase === 'processing' && (
        <View style={styles.center} role="status">
          <Text style={[styles.bigTitle, { fontSize: 20 }]}>Finding amounts and dates</Text>
          <SlidingBar />
          <Text style={styles.copy}>Nothing is saved until you check the list.</Text>
        </View>
      )}

      {phase === 'unavailable' && (
        <View style={styles.center}>
          <View style={styles.micOff}>
            <Icon name="mic" size={26} color={colors.textMuted} />
          </View>
          <Text style={[styles.bigTitle, { fontSize: 20 }]}>Can&apos;t listen right now</Text>
          <Text style={styles.copy}>{unavailableReason}</Text>
        </View>
      )}

      {phase === 'review' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.review}>
          {transcript ? (
            <>
              <Text style={styles.transcript}>
                “<Marked text={transcript} />”
              </Text>
              <Text style={styles.note}>Amounts and dates Finey picked up are marked.</Text>
            </>
          ) : (
            <Text style={styles.transcript}>We didn&apos;t catch anything. Try again a little closer to the microphone.</Text>
          )}

          {transcript !== '' && (
            <View style={{ paddingTop: 26 }}>
              <View style={styles.listHead}>
                <Text style={styles.listTitle}>
                  {rows.length === 0 ? 'No amounts found' : ticked.length === 1 ? '1 entry to save' : `${ticked.length} entries to save`}
                </Text>
                {rows.length > 0 && <Text style={styles.note}>Untick any that are wrong</Text>}
              </View>
              {rows.map((r, i) => (
                <ParsedRow
                  key={i}
                  entry={r}
                  on={!!ticks[i]}
                  today={today}
                  card={false}
                  onToggle={() => setTicks(ticks.map((t, j) => (j === i ? !t : t)))}
                  onEdit={() => setEditing(i)}
                  warning={r.duplicateOf ? { text: `You already have ${r.duplicateOf.name} for this amount that day.` } : undefined}
                />
              ))}
              {rows.length > 0 && <Text style={[styles.note, { marginTop: 6 }]}>Tap an entry to change its amount, category or date.</Text>}
              {rows.length === 0 && <Text style={styles.copyLeft}>Say an amount for each thing, like “Uber 120”.</Text>}
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.footer}>
        {phase === 'listening' && (
          <>
            <Pressable onPress={close} style={[styles.secondary, { flex: 1 }]}>
              <Text style={styles.secondaryLabel}>Cancel</Text>
            </Pressable>
            <Pressable onPress={stop} style={({ pressed }) => [{ flex: 1 }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <LinearGradient colors={accent.primary} style={styles.stop}>
                <PulseRing />
                <View style={styles.stopSquare} />
                <Text style={styles.stopLabel}>Stop and review</Text>
              </LinearGradient>
            </Pressable>
          </>
        )}
        {(phase === 'review' || phase === 'unavailable') && (
          <>
            {phase === 'review' ? (
              <Pressable onPress={listen} style={[styles.secondary, { paddingHorizontal: 20 }]}>
                <Icon name="mic" size={18} color={colors.text} />
                <Text style={styles.secondaryLabel}>Record again</Text>
              </Pressable>
            ) : (
              <Pressable onPress={listen} style={[styles.secondary, { paddingHorizontal: 20 }]}>
                <Text style={styles.secondaryLabel}>Try again</Text>
              </Pressable>
            )}
            {phase === 'review' && ticked.length > 0 ? (
              <PrimaryButton label={ticked.length === 1 ? 'Save 1 entry' : `Save ${ticked.length} entries`} onPress={save} style={{ flex: 1 }} />
            ) : (
              <PrimaryButton label="Type it instead" onPress={() => router.replace('/entry/paste')} style={{ flex: 1 }} />
            )}
          </>
        )}
      </View>

      <ParsedEditSheet
        entry={editing !== null ? rows[editing] : null}
        today={today}
        onClose={() => setEditing(null)}
        onSave={(changed) => {
          setRows(rows.map((r, i) => (i === editing ? changed : r)));
          setTicks(ticks.map((t, i) => (i === editing ? true : t)));
          setEditing(null);
        }}
      />
    </Screen>
  );
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Transcript with amounts as purple tags and dates underlined.
function Marked({ text }: { text: string }) {
  const accent = useAccent();
  const parts: { text: string; kind?: 'amount' | 'date' }[] = [];
  let last = 0;
  for (const m of text.matchAll(HIGHLIGHT)) {
    const i = m.index ?? 0;
    if (i > last) parts.push({ text: text.slice(last, i) });
    parts.push({ text: m[0], kind: /\d/.test(m[0]) ? 'amount' : 'date' });
    last = i + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return (
    <>
      {parts.map((p, i) =>
        p.kind === 'amount' ? (
          <Text key={i} style={[styles.amountTag, { backgroundColor: `rgba(${accent.rgb},0.24)`, color: accent.chipText }]}>{` ${p.text} `}</Text>
        ) : p.kind === 'date' ? (
          <Text key={i} style={[styles.dateMark, { textDecorationColor: accent.iris }]}>{p.text}</Text>
        ) : (
          <Text key={i}>{p.text}</Text>
        ),
      )}
    </>
  );
}

const BAR_HEIGHTS = [18, 30, 44, 26, 52, 36, 22, 48, 60, 34, 20, 42, 56, 30, 46, 24, 38, 58, 28, 40, 50, 26, 34, 20];

function Wave() {
  return (
    <View style={styles.wave} aria-hidden>
      {BAR_HEIGHTS.map((h, i) => (
        <WaveBar key={i} height={h} delay={(i * 130) % 1100} />
      ))}
    </View>
  );
}

function WaveBar({ height, delay }: { height: number; delay: number }) {
  const accent = useAccent();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 550, delay, easing: Easing.inOut(Easing.quad), useNativeDriver: nativeDriver }),
        Animated.timing(v, { toValue: 0, duration: 550, easing: Easing.inOut(Easing.quad), useNativeDriver: nativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  return (
    <Animated.View style={{ height, width: 5, transform: [{ scaleY: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }}>
      <LinearGradient colors={[accent.lilacSoft, accent.iris]} style={{ flex: 1, borderRadius: 3 }} />
    </Animated.View>
  );
}

function PulseRing() {
  const accent = useAccent();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: nativeDriver }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.ring,
        { borderColor: `rgba(${accent.rgb},0.6)` },
        { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }] },
      ]}
    />
  );
}

function SlidingBar() {
  const accent = useAccent();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barGlow, { left: v.interpolate({ inputRange: [0, 1], outputRange: ['-40%', '100%'] }) }]}>
        <LinearGradient colors={[`rgba(${accent.rgb},0)`, accent.lilac, `rgba(${accent.rgb},0)`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22, paddingHorizontal: 32, paddingBottom: 60 },
  bigTitle: { fontFamily: fonts.expandedSemibold, fontSize: 22, color: colors.text, textAlign: 'center' },
  timer: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, ...tabular },
  copy: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textMuted, textAlign: 'center' },
  copyLeft: { paddingTop: 8, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  micOff: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  wave: { height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  review: { paddingTop: 20, paddingHorizontal: space.screenX, paddingBottom: 24 },
  transcript: { fontFamily: fonts.regular, fontSize: 21, lineHeight: 34, color: '#E9E9EE' },
  amountTag: { fontFamily: fonts.semibold, borderRadius: 6, ...tabular },
  dateMark: { textDecorationLine: 'underline' },
  note: { marginTop: 14, fontFamily: fonts.regular, fontSize: 13, color: colors.textFaint },
  listHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.line },
  listTitle: { marginBottom: 10, fontFamily: fonts.expandedSemibold, fontSize: 16, color: colors.text },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: space.screenX, paddingBottom: 28, paddingTop: 12 },
  secondary: { height: 56, borderRadius: 28, backgroundColor: colors.surface2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  stop: { height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)' },
  ring: { borderRadius: 28, borderWidth: 2 },
  stopSquare: { width: 12, height: 12, borderRadius: 3, backgroundColor: '#FFFFFF' },
  stopLabel: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textOnAccent },
  barTrack: { width: '100%', height: 4, borderRadius: 2, backgroundColor: colors.surface3, overflow: 'hidden' },
  barGlow: { position: 'absolute', top: 0, bottom: 0, width: '40%' },
  play: { height: 40, paddingLeft: 10, paddingRight: 14, borderRadius: 20, backgroundColor: colors.surface2, flexDirection: 'row', alignItems: 'center', gap: 8 },
  playTime: { fontFamily: fonts.medium, fontSize: 13, color: colors.text, ...tabular },
});
