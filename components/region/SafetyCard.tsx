import { useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import type { RegionStats } from '../../data/regionStats';
import StatCard, { StatSource } from './StatCard';
import { REGION_COLORS } from './theme';

// O eixo do Figma não é linear: cada faixa ocupa a mesma altura, para que os
// crimes raros não sumam ao lado dos mais frequentes.
const Y_TICKS = [0, 10, 25, 50, 100, 150, 200];
const SECTION_HEIGHT = 28;
const Y_AXIS_WIDTH = 31;
const DOT_SIZE = 7.5;

function toAxisPosition(value: number) {
  const last = Y_TICKS.length - 1;
  if (value >= Y_TICKS[last]) return last;
  const index = Y_TICKS.findIndex((tick, i) => value >= tick && value < Y_TICKS[i + 1]);
  return index + (value - Y_TICKS[index]) / (Y_TICKS[index + 1] - Y_TICKS[index]);
}

function Dot() {
  return <View style={styles.dot} />;
}

type SafetyCardProps = {
  safety: RegionStats['safety'];
  style?: StyleProp<ViewStyle>;
};

export default function SafetyCard({ safety, style }: SafetyCardProps) {
  const [cardWidth, setCardWidth] = useState(0);

  const plotWidth = cardWidth - Y_AXIS_WIDTH;
  const slotWidth = plotWidth / safety.crimes.length;

  // O gifted-charts aplica initialSpacing duas vezes (no ScrollView e no
  // conteúdo); a metade do valor centraliza o primeiro pirulito na faixa.
  const initialSpacing = (slotWidth - 1) / 4;

  const data = safety.crimes.map(({ label, value }) => ({
    value: toAxisPosition(value),
    label,
    topLabelComponent: Dot,
  }));

  return (
    <StatCard title="Segurança" style={style}>
      <View
        style={styles.chart}
        onLayout={(event) => setCardWidth(event.nativeEvent.layout.width)}
        accessibilityLabel={safety.crimes.map(({ label, value }) => `${label}: ${value}`).join(', ')}
      >
        {cardWidth > 0 ? (
          <BarChart
            data={data}
            width={plotWidth}
            height={SECTION_HEIGHT * (Y_TICKS.length - 1)}
            maxValue={Y_TICKS.length - 1}
            noOfSections={Y_TICKS.length - 1}
            yAxisLabelTexts={Y_TICKS.map(String)}
            yAxisLabelWidth={Y_AXIS_WIDTH}
            yAxisTextStyle={styles.axisText}
            yAxisThickness={0}
            xAxisThickness={0.5}
            xAxisColor={REGION_COLORS.chartAxis}
            rulesColor={REGION_COLORS.chartRule}
            rulesThickness={0.5}
            rulesType="solid"
            barWidth={1}
            frontColor={REGION_COLORS.chartMark}
            initialSpacing={initialSpacing}
            spacing={slotWidth - 1}
            endSpacing={0}
            xAxisLabelsHeight={20}
            xAxisTextNumberOfLines={2}
            xAxisLabelTextStyle={styles.crimeLabel}
            topLabelContainerStyle={styles.dotContainer}
            disableScroll
            disablePress
          />
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.summary}>{safety.summary}</Text>
        <StatSource tone="muted">{safety.source}</StatSource>
        <StatSource style={styles.note}>{safety.note}</StatSource>
      </View>
    </StatCard>
  );
}

const styles = StyleSheet.create({
  chart: {
    marginTop: 8,
    marginLeft: -12,
  },
  axisText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: REGION_COLORS.chartAxisText,
  },
  crimeLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 8,
    lineHeight: 9.5,
    textAlign: 'center',
    color: REGION_COLORS.chartLabel,
  },
  dotContainer: {
    top: DOT_SIZE / 2 - 1,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: REGION_COLORS.chartMark,
  },
  footer: {
    gap: 4,
    paddingTop: 16,
  },
  summary: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 15,
    color: REGION_COLORS.body,
  },
  note: {
    color: REGION_COLORS.accent,
  },
});
