import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { auth } from '../firebase';
import { listMappedPostsByTopic } from '../services/forum';
import type { Post, TopicId } from '../types/forum';

/**
 * Posts da RA marcados no mapa. Recarrega a cada foco, para que um post recém
 * publicado já apareça ao voltar para a região.
 *
 * Sem `topic` (região sem tópico no fórum) ou sem login (as regras do Firestore
 * só liberam o fórum para quem entrou) devolve lista vazia: o mapa é só um
 * extra da tela, então uma falha aqui também não vira mensagem de erro.
 */
export function useMappedPosts(topic: TopicId | undefined): Post[] {
  const [posts, setPosts] = useState<Post[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!topic || !auth.currentUser) {
        setPosts([]);
        return;
      }

      listMappedPostsByTopic(topic)
        .then((loaded) => {
          if (active) setPosts(loaded);
        })
        .catch((loadError: any) => {
          console.warn('[region] falha ao carregar posts do mapa:', loadError?.code ?? loadError);
        });

      return () => {
        active = false;
      };
    }, [topic]),
  );

  return posts;
}
