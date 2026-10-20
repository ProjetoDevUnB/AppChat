import type AsyncStorage from '@react-native-async-storage/async-storage';
import 'firebase/auth';

// Firebase exposes this API in its native entry point, but not its web types.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: typeof AsyncStorage): Persistence;
}
