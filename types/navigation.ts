import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { TopicId } from './forum';

// Rotas do Stack raiz (definido em App.tsx). Cada tela recebe suas props
// tipadas via RootStackScreenProps<'NomeDaRota'>, o que também tipa
// navigation.navigate() com os nomes de rota válidos.
export type RootStackParamList = {
  Home: undefined;
  Discover: undefined;
  SignUp: undefined;
  Login: undefined;
  Profile: undefined;
  Forum: undefined;
  TopicPosts: { topicId: TopicId };
  PostDetail: { postId: string; topicId: TopicId };
  CreatePost: { topicId: TopicId };
  Chat: { userId: string; userName?: string };
  Chats: undefined;
  RegionStats: undefined;
  Regions: undefined;
  RegionMap: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// Torna navigation.navigate() global também tipado (opcional, mas útil).
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
