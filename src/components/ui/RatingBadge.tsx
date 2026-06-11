import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RatingBadgeProps {
  label: string;
  value?: number;
  color: string;
}

export default function RatingBadge({ label, value, color }: RatingBadgeProps) {
  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      <Text style={styles.value}>
        {value !== undefined ? value.toFixed(1) : '-'}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  label: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});
