import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { auth } from '../firebase';
import { getAuthor, type Author } from '../services/users';

/**
 * Nome e foto do usuário logado, lidos do documento `users/{uid}` — é o que o
 * cabeçalho do fórum mostra no avatar. Devolve `null` enquanto ninguém está
 * logado ou enquanto a leitura não chega.
 *
 * Passa por `getAuthor` em vez de ler o documento direto para aproveitar o
 * mesmo cache dos autores dos posts: numa tela em que o usuário aparece como
 * autor, o cabeçalho não paga leitura nenhuma.
 */
export function useCurrentAuthor(): Author | null {
  const [author, setAuthor] = useState<Author | null>(null);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAuthor(null);
        return;
      }

      // `getAuthor` nunca rejeita: no pior caso devolve o nome de fallback.
      getAuthor(user.uid).then((loaded) => {
        if (active) setAuthor(loaded);
      });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return author;
}
