import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScoreBucket } from '../../utils/groupMath';
import { getScoreColor } from '../../utils/scoreEngine';
import { COLORS, SIZES } from '../../constants/theme';

interface ScoreDistributionChartProps {
  buckets: ScoreBucket[];
  totalCount: number;
  onPress: () => void;
}

const CHART_HEIGHT = 120;

export default function ScoreDistributionChart({
  buckets,
  totalCount,
  onPress,
}: ScoreDistributionChartProps) {
  if (buckets.length === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Score Distribution</Text>
        <Text style={styles.subtitle}>{totalCount} Rated Restaurants</Text>
      </View>
      <View style={styles.chartArea}>
        {buckets.map((bucket) => (
          <View key={bucket.score} style={styles.barWrapper}>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${bucket.percentage}%`,
                    backgroundColor: getScoreColor(bucket.score),
                  },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{bucket.score.toFixed(1)}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginVertical: SIZES.base,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  header: {
    marginBottom: SIZES.padding,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    width: '50%',
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
  },
  barLabel: {
    marginTop: 4,
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: '600',
  },
});
