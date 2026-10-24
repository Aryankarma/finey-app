import { PinFlow } from '@/components/pin-flow';
import { usePinStatus } from '@/store/pin';

// First open: Finey asks for a PIN before anything else. Once it's set, the root layout
// lets the tabs in and this screen goes away.
export default function WelcomeScreen() {
  const markSet = usePinStatus((s) => s.markSet);
  return <PinFlow mode="setup" onDone={markSet} />;
}
