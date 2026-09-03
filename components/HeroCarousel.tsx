import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { SparkleLarge, SparkleSmall } from './icons/SparkleIcon';

// Carrossel de destaque do topo da tela de descoberta ("Passeios no DF").
// Imagens mockadas para o carrousel. 

const CARD_HEIGHT = 242;
const CARD_MARGIN = 16;
const CARD_RADIUS = 32;

export type HeroSlide = {
  image: ImageSourcePropType;
  title: string;
};

type HeroCarouselProps = {
  slides: HeroSlide[];
  style?: StyleProp<ViewStyle>;
};

export default function HeroCarousel({ slides, style }: HeroCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  const cardWidth = screenWidth - CARD_MARGIN * 2;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={style}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <View key={index} style={[styles.slide, { width: screenWidth }]}>
            <View style={[styles.card, { width: cardWidth }]}>
              <Image
                source={slide.image}
                style={[styles.photo, { width: cardWidth, height: CARD_HEIGHT }]}
                resizeMode="cover"
              />

              {/* Degradê do Figma: transparente até 40,39% e #832D51 a 44% em 76,93%. */}
              <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
                <Defs>
                  <LinearGradient id="heroOverlay" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0.4039" stopColor="#888888" stopOpacity={0} />
                    <Stop offset="0.7693" stopColor="#832D51" stopOpacity={0.44} />
                    <Stop offset="1" stopColor="#832D51" stopOpacity={0.44} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroOverlay)" />
              </Svg>

              <View style={styles.sparkleLarge} pointerEvents="none">
                <SparkleLarge size={86.89} />
              </View>
              <View style={styles.sparkleSmall} pointerEvents="none">
                <SparkleSmall size={42.25} />
              </View>

              <Text style={styles.title}>{slide.title}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination} pointerEvents="none">
        {slides.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === activeIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    alignItems: 'center',
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#832D51',
    // Figma: dy 4, blur (stdDeviation) 2 -> shadowRadius 4, #696969 a 72%.
    shadowColor: '#696969',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.72,
    shadowRadius: 4,
    elevation: 6,
  },
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  sparkleLarge: {
    position: 'absolute',
    top: 6.56,
    right: 6.56,
  },
  sparkleSmall: {
    position: 'absolute',
    top: 93.28,
    right: 7.39,
  },
  title: {
    position: 'absolute',
    left: 20,
    bottom: 68,
    width: 204,
    fontFamily: 'Inter_700Bold',
    fontSize: 40,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: '#FFF9FB',
  },
  pagination: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
  },
  dotActive: {
    backgroundColor: 'rgba(240, 240, 240, 0.8)',
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
