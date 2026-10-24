import { useRouter } from 'expo-router';

import { PinFlow } from '@/components/pin-flow';

export default function ChangePinScreen() {
  const router = useRouter();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/settings'));
  return <PinFlow mode="change" onBack={back} onDone={back} />;
}
