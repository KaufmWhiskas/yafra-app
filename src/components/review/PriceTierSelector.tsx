import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { hapticSelection } from '../../utils/haptics';
import { COLORS, SIZES } from '../../constants/theme';

interface PriceTierSelectorProps {
  value: number; // 1 to 4 maps to €, €€, €€€, €€€€
  onChange: (value: number) => void;
}

export default function PriceTierSelector({
  value,
  onChange,
}: PriceTierSelectorProps) {
  const tiers = [
    { level: 1, label: '€', desc: 'Budget' },
    { level: 2, label: '€€', desc: 'Moderate' },
    { level: 3, label: '€€€', desc: 'Pricey' },
    { level: 4, label: '€€€€', desc: 'Splurge' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Price Tier Estimation</Text>
      <View style={styles.row}>
        {tiers.map((t) => {
          const isActive = value === t.level;
          return (
            <TouchableOpacity
              key={t.level}
              style={[styles.tierButton, isActive && styles.tierButtonActive]}
              onPress={() => {
                hapticSelection();
                onChange(t.level);
              }}
            >
              <Text
                style={[styles.tierText, isActive && styles.tierTextActive]}
              >
                {t.label}
              </Text>
              <Text
                style={[styles.descText, isActive && styles.descTextActive]}
              >
                {t.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.padding,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  tierButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tierButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tierText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tierTextActive: {
    color: COLORS.surface,
  },
  descText: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
  },
  descTextActive: {
    color: COLORS.surface + 'cc',
  },
});
