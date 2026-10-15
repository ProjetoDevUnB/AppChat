import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { RegionStats } from '../../data/regionStats';
import StatCard, { StatSource } from './StatCard';
import { REGION_COLORS } from './theme';

type LeisureCardProps = {
  leisure: RegionStats['leisure'];
  style?: StyleProp<ViewStyle>;
};

export default function LeisureCard({ leisure, style }: LeisureCardProps) {
  return (
    <StatCard title="Lazer" style={style}>
      {leisure.items.map(({ label, percent }) => (
        <View
          key={label}
          style={styles.row}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={label}
          accessibilityValue={{ min: 0, max: 100, now: percent }}
        >
          <View style={styles.rowText}>
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
            <Text style={styles.value}>{percent}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${percent}%` }]} />
          </View>
        </View>
      ))}

      <StatSource style={styles.source}>{leisure.source}</StatSource>
    </StatCard>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 2,
  },
  rowText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 4,
  },
  label: {
    flexShrink: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 18,
    color: REGION_COLORS.title,
  },
  value: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: REGION_COLORS.title,
  },
  track: {
    height: 3,
    borderRadius: 9999,
    backgroundColor: REGION_COLORS.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 9999,
    backgroundColor: REGION_COLORS.accent,
  },
  source: {
    marginTop: 6,
  },
});
