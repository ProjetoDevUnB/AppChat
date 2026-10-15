import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { RegionStats } from '../../data/regionStats';
import { checkCircleXml } from '../icons/regionIconsXml';
import StatCard, { StatSource } from './StatCard';

type AmenitiesCardProps = {
  amenities: RegionStats['amenities'];
  style?: StyleProp<ViewStyle>;
};

export default function AmenitiesCard({ amenities, style }: AmenitiesCardProps) {
  return (
    <StatCard title={amenities.title} titleStyle={styles.title} style={style}>
      <View style={styles.list}>
        {amenities.items.map((item) => (
          <View key={item} style={styles.item}>
            <SvgXml xml={checkCircleXml} />
            <Text style={styles.itemLabel}>{item}</Text>
          </View>
        ))}
      </View>

      <StatSource>{amenities.source}</StatSource>
    </StatCard>
  );
}

const styles = StyleSheet.create({
  title: {
    lineHeight: 18,
    marginBottom: 7,
  },
  list: {
    marginBottom: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  itemLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 18,
    color: '#000000',
  },
});
