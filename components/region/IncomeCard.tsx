import { useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import type { RegionStats } from '../../data/regionStats';
import StatCard, { StatSource } from './StatCard';
import { REGION_COLORS } from './theme';

const CHART_HEIGHT = 80;
const BAR_GAP = 1;
const TALLEST_BAR_RATIO = 0.8;
const HIGHLIGHT_LABEL_WIDTH = 60;

type IncomeCardProps = {
  income: RegionStats['income'];
  regionName: string;
  style?: StyleProp<ViewStyle>;
};

export default function IncomeCard({ income, regionName, style }: IncomeCardProps) {
  const [chartWidth, setChartWidth] = useState(0);

  const count = income.regions.length;
  const barWidth = (chartWidth - BAR_GAP * (count - 1)) / count;
  const maxValue = Math.max(...income.regions.map((r) => r.value)) / TALLEST_BAR_RATIO;

  const data = income.regions.map(({ label, value }) => {
    const isRegion = label === regionName;
    return {
      value,
      frontColor: isRegion ? REGION_COLORS.accent : REGION_COLORS.track,
      topLabelComponent: isRegion
        ? () => <Text style={styles.highlightLabel}>{label}</Text>
        : undefined,
      topLabelContainerStyle: isRegion
        ? { width: HIGHLIGHT_LABEL_WIDTH, left: (barWidth - HIGHLIGHT_LABEL_WIDTH) / 2 }
        : undefined,
    };
  });

  return (
    <StatCard title="Rendimento domiciliar" style={style}>
      <Text style={styles.summary}>{income.summary}</Text>

      <View
        style={styles.chart}
        onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
        accessibilityLabel={`Renda domiciliar média por região administrativa; ${regionName} em destaque`}
      >
        {chartWidth > 0 ? (
          <BarChart
            data={data}
            width={chartWidth}
            height={CHART_HEIGHT}
            maxValue={maxValue}
            barWidth={barWidth}
            spacing={BAR_GAP}
            initialSpacing={0}
            endSpacing={0}
            yAxisLabelWidth={0}
            xAxisLabelsHeight={0}
            yAxisThickness={0}
            xAxisThickness={0}
            hideYAxisText
            hideRules
            disableScroll
            disablePress
          />
        ) : null}
      </View>

      <StatSource tone="muted" style={styles.source}>
        {income.source}
      </StatSource>
    </StatCard>
  );
}

const styles = StyleSheet.create({
  summary: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 15,
    color: REGION_COLORS.body,
  },
  chart: {
    height: CHART_HEIGHT,
  },
  highlightLabel: {
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
    fontSize: 8,
    lineHeight: 12,
    color: REGION_COLORS.accent,
  },
  source: {
    fontSize: 10,
  },
});
