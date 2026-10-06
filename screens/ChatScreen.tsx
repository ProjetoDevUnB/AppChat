import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Chat } from '@kesha-antonov/react-native-chat';
import type { RootStackScreenProps } from '../types/navigation'; // Adjust path as needed

export default function ChatScreen({ navigation, route }: RootStackScreenProps<'Chat'>) {
  const insets = useSafeAreaInsets();
  const recipientName = route.params?.userName ?? 'Chat';

  const [messages, setMessages] = useState([
    {
      _id: 1,
      text: 'Hello developer',
      createdAt: new Date(),
      user: { _id: 2, name: 'John Doe', avatar: 'https://placeimg.com/140/140/any' },
    },
  ]);

  const onSend = useCallback((newMessages = []) => {
    setMessages(previous => Chat.append(previous, newMessages));
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Custom Navbar */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={24} color="#111111" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {recipientName}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Chat Component */}
	<Chat messages={messages} onSend={onSend} user={{ _id: 1 }} />
    </View>
	);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#111111',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32, // Balances layout against the back button width
  },
});
