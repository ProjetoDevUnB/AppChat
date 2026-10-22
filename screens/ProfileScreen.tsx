import { Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { Fragment, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { auth } from '../firebase';
import BottomNavBar, { NAV_BAR_HEIGHT } from '../components/BottomNavBar';
import { cameraXml, galleryXml } from '../components/icons/photoIconsXml';
import {
  badgeChevronXml,
  bellXml,
  chevronLightXml,
  chevronXml,
  heartXml,
  helpXml,
  lockXml,
  logoutXml,
  searchXml,
  settingsXml,
} from '../components/icons/profileIconsXml';
import {
  changeProfilePhoto,
  PermissionDeniedError,
  PhotoTooLargeError,
  type PhotoSource,
} from '../services/profilePhoto';
import { ensureUserProfile } from '../services/userProfile';
import { clearAuthorCache, getInitials } from '../services/users';
import type { RootStackScreenProps } from '../types/navigation';
import type { UserProfile } from '../types/user';
import { TimeoutError } from '../utils/withTimeout';

const PROFILE_TAB_INDEX = 4;

// Favoritos ainda não são salvos em lugar nenhum — quando existirem,
// este número deve vir do Firestore.
const FAVORITES_COUNT = 0;

type IconSpec = { xml: string; width: number; height: number };

type MenuItem = {
  key: string;
  label: string;
  icon: IconSpec;
  onPress?: () => void;
};

const PREFERENCE_ITEMS: MenuItem[] = [
  { key: 'notificacoes', label: 'Notificações', icon: { xml: bellXml, width: 12, height: 15 } },
  {
    key: 'busca',
    label: 'Preferências de busca',
    icon: { xml: searchXml, width: 13.5, height: 13.5 },
  },
];

const PHOTO_SOURCES: { key: PhotoSource; label: string; description: string; xml: string }[] = [
  { key: 'camera', label: 'Tirar uma foto', description: 'Abre a câmera do celular', xml: cameraXml },
  {
    key: 'library',
    label: 'Escolher da galeria',
    description: 'Usa uma foto já salva',
    xml: galleryXml,
  },
];

function describePhotoError(error: any): string {
  if (error instanceof PermissionDeniedError) {
    return error.source === 'camera'
      ? 'Libere o acesso à câmera nas configurações do aparelho para tirar uma foto.'
      : 'Libere o acesso às suas fotos nas configurações do aparelho.';
  }

  if (error instanceof TimeoutError) {
    return 'A conexão está demorando demais. Tente novamente.';
  }

  if (error instanceof PhotoTooLargeError) {
    return 'Essa imagem é pesada demais. Tente outra foto.';
  }

  switch (error?.code) {
    case 'permission-denied':
      return 'Você não tem permissão para salvar essa foto.';
    case 'unavailable':
      return 'Sem conexão. Verifique sua internet e tente novamente.';
    default:
      return 'Não foi possível enviar a foto. Tente novamente.';
  }
}

type MenuCardProps = {
  items: MenuItem[];
  chevronXml: string;
};

function MenuCard({ items, chevronXml: chevron }: MenuCardProps) {
  return (
    <View style={styles.menuCard}>
      {items.map((item, index) => {
        const isDanger = item.key === 'sair';

        return (
          <Fragment key={item.key}>
            {index > 0 && <View style={styles.divider} />}
            <Pressable
              style={styles.menuRow}
              onPress={item.onPress}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={styles.menuRowLeft}>
                <View style={[styles.menuIconBox, isDanger && styles.menuIconBoxDanger]}>
                  <SvgXml
                    xml={item.icon.xml}
                    width={item.icon.width}
                    height={item.icon.height}
                  />
                </View>
                <Text style={[styles.menuLabel, isDanger && styles.menuLabelDanger]}>
                  {item.label}
                </Text>
              </View>
              <SvgXml xml={chevron} width={7.4} height={12} />
            </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
}

export default function ProfileScreen({ navigation }: RootStackScreenProps<'Profile'>) {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_600SemiBold });


  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [photoOverride, setPhotoOverride] = useState<string | null>(null);
  const [isUploadingPhoto, setUploadingPhoto] = useState(false);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const pendingSourceRef = useRef<PhotoSource | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    let active = true;
    ensureUserProfile(user)
      .then((loaded) => {
        if (active) setProfile(loaded);
      })
      .catch((error: any) => {
        // Falhar ao carregar não é erro do usuário: a tela apenas segue com as
        // iniciais em vez de acusar um problema que ele não causou.
        console.warn('[profile] falha ao carregar perfil:', error?.code ?? error);
      });

    return () => {
      active = false;
    };
  }, [user]);

  if (!fontsLoaded) {
    return null;
  }

  // O documento é a fonte de verdade; o Auth cobre a janela até ele chegar.
  const displayName = profile?.name || user?.displayName || 'Usuário';
  const email = profile?.email || user?.email || '';
  const handle = email ? `@${email.split('@')[0]}` : '';
  const photoURL = photoOverride ?? profile?.photoDataUrl ?? null;

  const runPendingPhotoPick = async () => {
    const source = pendingSourceRef.current;
    pendingSourceRef.current = null;
    if (!source) return;

    setPhotoError('');
    setUploadingPhoto(true);
    try {
      const url = await changeProfilePhoto(source);
      if (url) {
        setPhotoOverride(url);
      }
    } catch (error: any) {
      console.warn('[profile] falha ao enviar foto:', error?.code ?? error, error?.message ?? '');
      setPhotoError(describePhotoError(error));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleChoosePhotoSource = (source: PhotoSource) => {
    pendingSourceRef.current = source;
    setSheetOpen(false);

    // No iOS a câmera/galeria também são apresentadas como modal: abrir antes
    // de o menu terminar de sair faz o sistema descartar uma das duas telas.
    // `onDismiss` do Modal avisa quando é seguro; nas outras plataformas o
    // picker pode subir na hora.
    if (Platform.OS !== 'ios') {
      void runPendingPhotoPick();
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.warn('[profile] falha ao sair:', error?.code ?? error);
    }

    // Nomes e fotos da conta anterior não podem vazar para a próxima sessão.
    clearAuthorCache();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const accountItems: MenuItem[] = [
    {
      key: 'configuracoes',
      label: 'Configurações',
      icon: { xml: settingsXml, width: 15.075, height: 15 },
    },
    { key: 'privacidade', label: 'Privacidade', icon: { xml: lockXml, width: 12, height: 15.75 } },
    { key: 'ajuda', label: 'Ajuda e suporte', icon: { xml: helpXml, width: 15, height: 15 } },
    {
      key: 'sobre',
      label: 'Sobre o aplicativo',
      icon: { xml: helpXml, width: 15, height: 15 },
      onPress: () => navigation.navigate('About'),
    },
    {
      key: 'sair',
      label: 'Sair',
      icon: { xml: logoutXml, width: 13.5, height: 13.5 },
      onPress: handleSignOut,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: NAV_BAR_HEIGHT + insets.bottom + 48 }}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 24) + 20 }]}>
          <Pressable
            style={styles.avatar}
            onPress={() => setSheetOpen(true)}
            disabled={isUploadingPhoto}
            accessibilityRole="button"
            accessibilityLabel={photoURL ? 'Trocar a foto de perfil' : 'Adicionar uma foto de perfil'}
          >
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            )}

            {isUploadingPhoto ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#EEEEEE" />
              </View>
            ) : (
              <View style={styles.avatarBadge}>
                <SvgXml xml={cameraXml} width={16} height={16} />
              </View>
            )}
          </Pressable>

          <Text style={styles.name}>{displayName}</Text>
          {handle ? <Text style={styles.handle}>{handle}</Text> : null}
          {photoError ? <Text style={styles.photoError}>{photoError}</Text> : null}

          <Pressable style={styles.editButton} onPress={() => {}} accessibilityRole="button">
            <Text style={styles.editButtonText}>Editar perfil</Text>
          </Pressable>
        </View>

        <Pressable style={styles.favoritesCard} onPress={() => {}} accessibilityRole="button">
          <View style={styles.favoritesLeft}>
            <View style={styles.favoritesIconBox}>
              <SvgXml xml={heartXml} width={20} height={18.35} />
            </View>
            <View>
              <Text style={styles.favoritesTitle}>Meus favoritos</Text>
              <Text style={styles.favoritesSubtitle}>Regiões que você salvou</Text>
            </View>
          </View>

          <View style={styles.favoritesBadge}>
            <Text style={styles.favoritesBadgeText}>{FAVORITES_COUNT}</Text>
            <SvgXml xml={badgeChevronXml} width={4.317} height={7} />
          </View>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferências</Text>
          <MenuCard items={PREFERENCE_ITEMS} chevronXml={chevronLightXml} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Conta</Text>
          <MenuCard items={accountItems} chevronXml={chevronXml} />
        </View>
      </ScrollView>

      <BottomNavBar
        activeIndex={PROFILE_TAB_INDEX}
        onPressItem={(_index, key) => {
          if (key === 'home') navigation.navigate('Discover');
          if (key === 'regions') navigation.navigate('Regions');
          if (key === 'search') navigation.navigate('Chats');
          if (key === 'chat') navigation.navigate('Forum');
        }}
        style={[styles.navBar, { bottom: insets.bottom + 16 }]}
      />

      <Modal
        visible={isSheetOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSheetOpen(false)}
        onDismiss={runPendingPhotoPick}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setSheetOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        >
          {/* Absorve o toque para que tocar no cartão não feche o menu. */}
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
            <View style={styles.sheetGrabber} />
            <Text style={styles.sheetTitle}>Foto de perfil</Text>

            {PHOTO_SOURCES.map((option, index) => (
              <Fragment key={option.key}>
                {index > 0 && <View style={styles.divider} />}
                <Pressable
                  style={styles.sheetOption}
                  onPress={() => handleChoosePhotoSource(option.key)}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                >
                  <View style={styles.sheetOptionIcon}>
                    <SvgXml xml={option.xml} width={18} height={18} />
                  </View>
                  <View style={styles.sheetOptionTexts}>
                    <Text style={styles.sheetOptionLabel}>{option.label}</Text>
                    <Text style={styles.sheetOptionDescription}>{option.description}</Text>
                  </View>
                </Pressable>
              </Fragment>
            ))}

            <Pressable
              style={styles.sheetCancel}
              onPress={() => setSheetOpen(false)}
              accessibilityRole="button"
            >
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF8F8',
  },
  header: {
    alignItems: 'center',
    paddingBottom: 20,
    backgroundColor: '#E86E97',
    borderBottomLeftRadius: 92,
    borderBottomRightRadius: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7F8D18',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 38.4,
    letterSpacing: -0.64,
    color: '#EEEEEE',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E86E97',
    backgroundColor: '#832D51',
  },
  photoError: {
    marginTop: 12,
    marginHorizontal: 32,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: '#FFDAD6',
  },
  name: {
    marginTop: 16,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    lineHeight: 31.2,
    letterSpacing: -0.24,
    color: '#FFFFFF',
  },
  handle: {
    marginTop: 3,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: '#EEEEEE',
  },
  editButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingTop: 7,
    paddingBottom: 8.39,
    borderRadius: 9999,
    backgroundColor: '#832D51',
  },
  editButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 14.4,
    letterSpacing: 0.12,
    color: '#FFFFFF',
  },
  favoritesCard: {
    marginTop: 16,
    marginHorizontal: 20,
    height: 72,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 9999,
    backgroundColor: '#832E52',
    // Figma: drop-shadow dy 4, blur 9, preto a 5%.
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 9,
    elevation: 2,
  },
  favoritesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  favoritesIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(238, 238, 238, 0.2)',
  },
  favoritesTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 25.6,
    color: '#EEEEEE',
  },
  favoritesSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 13.2,
    color: 'rgba(238, 238, 238, 0.8)',
  },
  favoritesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#888888',
    backgroundColor: '#EEEEEE',
  },
  favoritesBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 14.4,
    letterSpacing: 0.12,
    color: '#888888',
  },
  section: {
    marginTop: 16,
    marginHorizontal: 20,
    paddingTop: 7,
    gap: 8,
  },
  sectionLabel: {
    paddingLeft: 7,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 14.4,
    letterSpacing: 0.12,
    color: '#696969',
  },
  menuCard: {
    padding: 1,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  menuRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CCCCCC',
  },
  menuIconBoxDanger: {
    backgroundColor: '#FFDAD6',
  },
  menuLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: '#1A1A1A',
  },
  menuLabelDanger: {
    fontFamily: 'Inter_500Medium',
    color: '#BA1A1A',
  },
  divider: {
    // No Figma a linha tem 316px dentro de um card de ~351px: 16px de recuo em cada lado.
    alignSelf: 'stretch',
    marginHorizontal: 16,
    height: 0.5,
    backgroundColor: 'rgba(207, 195, 200, 0.3)',
  },
  navBar: {
    position: 'absolute',
    left: 32,
    right: 32,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    paddingTop: 8,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  sheetGrabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CFC3C8',
  },
  sheetTitle: {
    marginTop: 16,
    marginBottom: 8,
    paddingLeft: 7,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 14.4,
    letterSpacing: 0.12,
    color: '#696969',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  sheetOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#832E52',
  },
  sheetOptionTexts: {
    flex: 1,
  },
  sheetOptionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 21,
    color: '#1A1A1A',
  },
  sheetOptionDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 13.2,
    color: '#696969',
  },
  sheetCancel: {
    marginTop: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: '#F5F5F5',
  },
  sheetCancelText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1A1A1A',
  },
});
