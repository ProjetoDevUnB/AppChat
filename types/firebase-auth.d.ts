import type AsyncStorage from '@react-native-async-storage/async-storage';
import 'firebase/auth';

// O Firebase exporta esta API na versão nativa, mas não nas definições de tipos para web.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: typeof AsyncStorage): Persistence;
}
