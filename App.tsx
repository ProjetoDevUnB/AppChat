import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold, useFonts
} from '@expo-google-fonts/inter';
import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import CreatePostScreen from './screens/CreatePostScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import ForumScreen from './screens/ForumScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import PostDetailScreen from './screens/PostDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import AboutScreen from './screens/AboutScreen';
import SignUpScreen from './screens/SignUpScreen';
import TopicPostsScreen from './screens/TopicPostsScreen';
import ChatScreen from './screens/ChatScreen';
import ChatsScreen from './screens/ChatsScreen';
import RegionStatsScreen from './screens/RegionStatsScreen';
import RegionsScreen from './screens/RegionsScreen';
import RegionMapScreen from './screens/RegionMapScreen';
import type { RootStackParamList } from './types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (restoredUser) => {
    setUser(restoredUser);
    setAuthReady(true);
  }), []);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  if (!fontsLoaded || !authReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAFBF8', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator accessibilityLabel="Carregando sessão" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer key={user?.uid ?? 'guest'}>
        <Stack.Navigator initialRouteName={user ? 'Discover' : 'Home'} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Discover" component={DiscoverScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Forum" component={ForumScreen} />
          <Stack.Screen name="TopicPosts" component={TopicPostsScreen} />
          <Stack.Screen name="PostDetail" component={PostDetailScreen} />
          <Stack.Screen name="CreatePost" component={CreatePostScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Chats" component={ChatsScreen} />
          <Stack.Screen name="RegionStats" component={RegionStatsScreen} />
          <Stack.Screen name="Regions" component={RegionsScreen} />
          <Stack.Screen name="RegionMap" component={RegionMapScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
