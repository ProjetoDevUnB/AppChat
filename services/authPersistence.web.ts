import { browserLocalPersistence, browserSessionPersistence, setPersistence, type Auth } from 'firebase/auth';

export function configureLoginPersistence(auth: Auth, rememberMe: boolean) {
  return setPersistence(auth, rememberMe
    ? browserLocalPersistence
    : browserSessionPersistence);
}
