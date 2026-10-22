import AsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, inMemoryPersistence, setPersistence, type Auth } from 'firebase/auth';

export function configureLoginPersistence(auth: Auth, rememberMe: boolean) {
  return setPersistence(auth, rememberMe
    ? getReactNativePersistence(AsyncStorage)
    : inMemoryPersistence);
}
