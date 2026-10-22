import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackIcon from '../components/icons/BackIcon';
import type { RootStackScreenProps } from '../types/navigation';

const DEVELOPERS = [
  {
    name: 'Gabriel Felix',
    github: 'gabfelix',
    initials: 'GF',
    contact: { label: 'E-mail', url: 'mailto:madmanfelix@gmail.com', detail: 'madmanfelix@gmail.com' },
  },
  {
    name: 'Vitor Lemos',
    github: 'vitorino99',
    initials: 'VL',
    contact: { label: 'LinkedIn', url: 'https://www.linkedin.com/in/vitor-lemos-339374182/' },
  },
  {
    name: 'Rodrigo Torreão',
    github: 'RodrigoTorreao',
    initials: 'RT',
    contact: { label: 'LinkedIn', url: 'https://www.linkedin.com/in/rodrigotorreao/' },
  },
];

function DeveloperAvatar({ github, initials, name }: typeof DEVELOPERS[number]) {
  const [failed, setFailed] = useState(false);

  return (
    <View style={styles.avatar}>
      <Text style={styles.initials}>{initials}</Text>
      {!failed && (
        <Image
          source={{ uri: `https://github.com/${github}.png?size=160` }}
          style={styles.avatarImage}
          accessibilityLabel={`Foto de ${name} no GitHub`}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

export default function AboutScreen({ navigation }: RootStackScreenProps<'About'>) {
  const insets = useSafeAreaInsets();
  const [linkError, setLinkError] = useState('');

  const openLink = async (url: string) => {
    setLinkError('');
    try {
      await Linking.openURL(url);
    } catch {
      setLinkError('Não foi possível abrir o link. Verifique se há um navegador ou aplicativo de e-mail disponível e tente novamente.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Voltar ao perfil"
          >
            <BackIcon />
          </Pressable>
          <Text style={styles.headerTitle} accessibilityRole="header">Sobre o aplicativo</Text>
        </View>
        <Text style={styles.appName}>mapeei</Text>
        <Text style={styles.subtitle}>Conheça quem está construindo este projeto.</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.notice}>
          <View style={styles.noticeHeading}>
            <Ionicons name="flask-outline" size={22} color="#832D51" />
            <Text style={styles.noticeTitle} accessibilityRole="header">Versão de teste</Text>
          </View>
          <Text style={styles.body}>
            Este aplicativo está em fase de testes e pode apresentar erros, interrupções e alterações de funcionalidades. Os dados podem ser alterados ou perdidos durante os testes.
          </Text>
          <Text style={styles.body}>
            O aplicativo é fornecido “como está”, sem qualquer tipo de garantia, expressa ou implícita, incluindo garantias de funcionamento, disponibilidade, precisão das informações ou adequação a uma finalidade específica. O uso é por sua conta e risco, observados os direitos previstos na legislação aplicável.
          </Text>
        </View>

        <Text style={styles.sectionTitle} accessibilityRole="header">Desenvolvedores</Text>
        {DEVELOPERS.map((developer) => (
          <View key={developer.github} style={styles.card}>
            <View style={styles.developerHeading}>
              <DeveloperAvatar {...developer} />
              <View style={styles.developerInfo}>
                <Text style={styles.name}>{developer.name}</Text>
                <Text style={styles.handle}>@{developer.github}</Text>
              </View>
            </View>
            <View style={styles.links}>
              <Pressable
                style={({ pressed }) => [styles.link, pressed && styles.pressed]}
                accessibilityRole="link"
                accessibilityLabel={`GitHub de ${developer.name}`}
                onPress={() => void openLink(`https://github.com/${developer.github}`)}
              >
                <Ionicons name="logo-github" size={18} color="#832D51" />
                <Text style={styles.linkText}>GitHub</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.link, pressed && styles.pressed]}
                accessibilityRole="link"
                accessibilityLabel={`${developer.contact.label} de ${developer.name}`}
                onPress={() => void openLink(developer.contact.url)}
              >
                <Ionicons
                  name={developer.contact.label === 'E-mail' ? 'mail-outline' : 'logo-linkedin'}
                  size={18}
                  color="#832D51"
                />
                <Text style={styles.linkText}>{developer.contact.label}</Text>
              </Pressable>
            </View>
            {'detail' in developer.contact && (
              <Text selectable style={styles.contactDetail}>{developer.contact.detail}</Text>
            )}
          </View>
        ))}
        {linkError ? <Text style={styles.error} accessibilityRole="alert">{linkError}</Text> : null}
      </ScrollView>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF8F8' },
  header: {
    backgroundColor: '#E86E97', paddingHorizontal: 20, paddingBottom: 28,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20, color: '#FFFFFF' },
  appName: { marginTop: 20, fontFamily: 'Inter_700Bold', fontSize: 32, color: '#FFFFFF' },
  subtitle: { marginTop: 8, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, color: '#FFFFFF' },
  content: { padding: 20, gap: 16, width: '100%', maxWidth: 680, alignSelf: 'center' },
  notice: { padding: 20, gap: 12, backgroundColor: '#FBE7EE', borderRadius: 18, borderWidth: 1, borderColor: '#EEC5D4' },
  noticeHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noticeTitle: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 16, color: '#832D51' },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22, color: '#513440' },
  sectionTitle: { marginTop: 8, fontFamily: 'Inter_700Bold', fontSize: 20, color: '#1A1A1A' },
  card: { padding: 20, gap: 16, borderRadius: 18, borderWidth: 1, borderColor: '#EEEEEE', backgroundColor: '#FFFFFF' },
  developerHeading: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  developerInfo: { flex: 1, gap: 4 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FBE7EE', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { ...StyleSheet.absoluteFillObject, width: 64, height: 64 },
  initials: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#832D51' },
  name: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#1A1A1A' },
  handle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#696969' },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  link: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: '#FBE7EE' },
  linkText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#832D51' },
  pressed: { opacity: 0.65 },
  contactDetail: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#696969' },
  error: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, color: '#BA1A1A' },
});
