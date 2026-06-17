import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface RatingBadgeProps {
  label: string;
  value?: number;
  color: string;
  count?: number;
  onPress?: () => void;
  disabled?: boolean;
}

export default function RatingBadge({
  label,
  value,
  color,
  count,
  onPress,
  disabled,
}: RatingBadgeProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: color }]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <View style={styles.valueWrapper}>
          <Text style={styles.value}>
            {value !== undefined ? value.toFixed(1) : '-'}
          </Text>
          {count !== undefined ? (
            <Text style={styles.subValue}>({count})</Text>
          ) : null}
        </View>
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      <View style={styles.valueWrapper}>
        <Text style={styles.value}>
          {value !== undefined ? value.toFixed(1) : '-'}
        </Text>
        {count !== undefined ? (
          <Text style={styles.subValue}>({count})</Text>
        ) : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    height: 95,
    justifyContent: 'space-between',
  },
  valueWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  subValue: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    marginTop: 1,
  },
  label: {
    fontSize: 11,
    color: '#fff',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
