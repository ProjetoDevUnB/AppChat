import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold, useFonts
} from '@expo-google-fonts/inter';
import { View } from 'react-native';
import CreatePostScreen from './screens/CreatePostScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import ForumScreen from './screens/ForumScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import PostDetailScreen from './screens/PostDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import SignUpScreen from './screens/SignUpScreen';
import TopicPostsScreen from './screens/TopicPostsScreen';
import type { RootStackParamList } from './types/navigation';

// Import só pelo efeito: garante que o Firebase seja inicializado no start do
// app, e não por acaso na primeira tela que importar `./firebase`.
import './firebase';
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#FAFBF8' }} />; // Tela branca durante carregamento da fonte
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Discover" component={DiscoverScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Forum" component={ForumScreen} />
          <Stack.Screen name="TopicPosts" component={TopicPostsScreen} />
          <Stack.Screen name="PostDetail" component={PostDetailScreen} />
          <Stack.Screen name="CreatePost" component={CreatePostScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
