import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

// Where persisted stores live on the device (localStorage on web).
export const deviceStorage = createJSONStorage(() => AsyncStorage);
