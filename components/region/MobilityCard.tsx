import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { MobilityMode, RegionStats } from '../../data/regionStats';
import { bikeXml, busXml, metroXml } from '../icons/regionIconsXml';
import StatCard, { StatSource } from './StatCard';
import { REGION_COLORS } from './theme';

const MODE_ICONS: Record<MobilityMode['key'], string> = {
  metro: metroXml,
  bus: busXml,
  bike: bikeXml,
};

type MobilityCardProps = {
  mobility: RegionStats['mobility'];
  style?: StyleProp<ViewStyle>;
};

export default function MobilityCard({ mobility, style }: MobilityCardProps) {
  return (
    <StatCard title="Mobilidade" style={[styles.card, style]}>
      <Text style={styles.summary}>{mobility.summary}</Text>

      <View style={styles.modes}>
        {mobility.modes.map((mode) => (
          <View
            key={mode.key}
            style={styles.mode}
            accessibilityLabel={`${mode.label}: ${mode.available ? 'disponível' : 'indisponível'}`}
          >
            <View style={styles.iconSlot}>
              <SvgXml
                xml={MODE_ICONS[mode.key]}
                color={mode.available ? REGION_COLORS.olive : REGION_COLORS.muted}
              />
            </View>
            <Text style={styles.modeLabel}>{mode.label}</Text>
          </View>
        ))}
      </View>

      <StatSource>{mobility.source}</StatSource>
    </StatCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingBottom: 13,
  },
  summary: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: REGION_COLORS.body,
  },
  modes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  mode: {
    alignItems: 'center',
    gap: 4,
  },
  iconSlot: {
    height: 17.5,
    justifyContent: 'center',
  },
  modeLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 15,
    color: REGION_COLORS.body,
  },
});
