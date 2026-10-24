import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { prototypePin } from '@/data/seed';

// The privacy PIN that guards hidden amounts. Kept in the phone's secure storage
// (the web build has none, so it falls back to local storage there).
const KEY = 'finey.pin';

export async function getPin(): Promise<string> {
  const saved = Platform.OS === 'web' ? await AsyncStorage.getItem(KEY) : await SecureStore.getItemAsync(KEY);
  // Until a PIN is set, the boards' sample PIN works.
  return saved ?? prototypePin;
}

export async function setPin(pin: string): Promise<void> {
  if (Platform.OS === 'web') await AsyncStorage.setItem(KEY, pin);
  else await SecureStore.setItemAsync(KEY, pin);
}

// A PIN is easy to guess when it repeats one digit or counts up or down: 1111, 1234, 98765.
export function isWeakPin(pin: string): boolean {
  return /^(\d)\1+$/.test(pin) || '01234567890'.includes(pin) || '09876543210'.includes(pin);
}

// Fingerprint or face unlock, when the phone has it set up. Never on web.
export async function canUseBiometrics(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
}

export async function unlockWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Show your amounts', fallbackLabel: 'Use PIN' });
  return result.success;
}
