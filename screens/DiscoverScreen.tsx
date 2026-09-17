import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import BottomNavBar, { NAV_BAR_HEIGHT } from '../components/BottomNavBar';
import CategoryCard from '../components/CategoryCard';
import HeroCarousel, { type HeroSlide } from '../components/HeroCarousel';
import BikeIcon from '../components/icons/BikeIcon';
import BusIcon from '../components/icons/BusIcon';
import CoinsIcon from '../components/icons/CoinsIcon';
import SecurityIcon from '../components/icons/SecurityIcon';
import type { RootStackScreenProps } from '../types/navigation';

const CAROUSEL_PHOTO = require('../assets/discover_carousel.jpg');

const HERO_SLIDES: HeroSlide[] = Array.from({ length: 5 }, () => ({
  image: CAROUSEL_PHOTO,
  title: 'Passeios no DF',
}));

const GUIDE_CARD_HEIGHT = 199;
const GUIDE_CARD_MARGIN = 16;
const GUIDE_CARD_BORDER = 1;

const CATEGORIES = [
  { key: 'seguranca', label: 'Segurança', Icon: SecurityIcon },
  { key: 'transporte', label: 'Transporte', Icon: BusIcon },
  { key: 'lazer', label: 'Lazer', Icon: BikeIcon },
  { key: 'custo-de-vida', label: 'Custo de vida', Icon: CoinsIcon },
];

export default function DiscoverScreen({ navigation }: RootStackScreenProps<'Discover'>) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          // espaço para o último parágrafo não ficar atrás do menu flutuante
          { paddingBottom: NAV_BAR_HEIGHT + insets.bottom + 48 },
        ]}
      >
        <Image
          source={require('../assets/logo_signup.png')}
          style={[styles.logo, { marginTop: Math.max(insets.top, 24) }]}
          resizeMode="contain"
        />

        <HeroCarousel slides={HERO_SLIDES} style={styles.hero} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Para saber mais</Text>
          <Text style={styles.sectionSubtitle}>
            clique no card para navegar pelas informações
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryRow}
          contentContainerStyle={styles.categoryRowContent}
        >
          {CATEGORIES.map(({ key, label, Icon }) => (
            <CategoryCard key={key} label={label} Icon={Icon} />
          ))}
        </ScrollView>

        <View style={styles.description}>
          <Text style={styles.paragraph}>
            Para ajudar você a tomar decisões com mais confiança, reunimos informações de{' '}
            <Text style={styles.paragraphStrong}>fontes oficiais e dados públicos</Text> sobre
            segurança, transporte, comércio/lazer e custo de vida, juntamente dos{' '}
            <Text style={styles.paragraphStrong}>relatos de moradores reais</Text>!
          </Text>
          <Text style={[styles.paragraph, styles.paragraphSpaced]}>
            Navegue por dados destrinchados e fáceis de entender, e sinta-se com repertório
            sobre o contexto local das diferentes regiões do Brasil.
          </Text>
        </View>

        <Text style={styles.guideHeading}>Morando sozinho pela primeira vez?</Text>

        <View style={styles.guideCard}>
          <Image
            source={require('../assets/discover_guide.jpg')}
            style={[
              styles.guidePhoto,
              {
                width: screenWidth - GUIDE_CARD_MARGIN * 2 - GUIDE_CARD_BORDER * 2,
                height: GUIDE_CARD_HEIGHT - GUIDE_CARD_BORDER * 2,
              },
            ]}
            resizeMode="cover"
          />

          {/* Degradê do Figma: transparente até 23,08% e #832D51 sólido em 100%. */}
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id="guideOverlay" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0.2308" stopColor="#686666" stopOpacity={0} />
                <Stop offset="1" stopColor="#832D51" stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#guideOverlay)" />
          </Svg>

          <Text style={styles.guideCta}>Clique aqui para conferir nosso guia!</Text>
        </View>

        <View style={[styles.description, styles.descriptionAfterCard]}>
          <Text style={styles.paragraph}>
            Nosso <Text style={styles.paragraphStrong}>guia</Text> reúne dicas práticas,
            checklists, explicações de termos comuns do mercado imobiliário e orientações para
            ajudar você a se preparar com mais segurança e tranquilidade para essa nova fase.
          </Text>
        </View>
      </ScrollView>

      <BottomNavBar
        activeIndex={0}
        onPressItem={(_index, key) => {
          if (key === 'profile') navigation.navigate('Profile');
        }}
        style={[styles.navBar, { bottom: insets.bottom + 16 }]}
      />

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBF8',
  },
  content: {
    alignItems: 'stretch',
  },
  logo: {
    width: 206,
    height: 116,
    alignSelf: 'center',
  },
  hero: {
    marginTop: 15,
  },
  sectionHeader: {
    marginTop: 28,
    paddingHorizontal: 28,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.64,
    color: '#1A1A1A',
  },
  sectionSubtitle: {
    marginTop: -4,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 17,
    color: '#AAAAAA',
  },
  categoryRow: {
    marginTop: 8,
  },
  categoryRowContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  description: {
    marginTop: 16,
    paddingHorizontal: 32,
  },
  descriptionAfterCard: {
    marginTop: 24,
  },
  paragraph: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0.2,
    color: '#1E1619',
  },
  paragraphStrong: {
    fontFamily: 'Inter_700Bold',
  },
  paragraphSpaced: {
    marginTop: 12,
  },
  guideHeading: {
    marginTop: 15,
    paddingHorizontal: 20,
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.64,
    color: '#1A1A1A',
  },
  guideCard: {
    marginTop: 16,
    marginHorizontal: GUIDE_CARD_MARGIN,
    height: GUIDE_CARD_HEIGHT,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 32,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 32,
    borderWidth: GUIDE_CARD_BORDER,
    borderColor: '#000000',
    overflow: 'hidden',
    backgroundColor: '#832D51',
    justifyContent: 'flex-end',
  },
  guidePhoto: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  guideCta: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  navBar: {
    position: 'absolute',
    left: 32,
    right: 32,
  },
});
