import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { hapticSelection } from '../../utils/haptics';
import { COLORS, SIZES } from '../../constants/theme';

export type ExperienceType = 'eat-in' | 'takeaway' | 'order';

interface Props {
  value: ExperienceType;
  onChange: (value: ExperienceType) => void;
}

export default function ExperienceToggle({ value, onChange }: Props) {
  const options: { label: string; val: ExperienceType }[] = [
    { label: 'Eat In', val: 'eat-in' },
    { label: 'Takeaway', val: 'takeaway' },
    { label: 'Order', val: 'order' },
  ];

  return (
    <View style={styles.container}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.val}
          style={[styles.button, value === opt.val && styles.activeButton]}
          onPress={() => {
            hapticSelection();
            onChange(opt.val);
          }}
        >
          <Text style={[styles.text, value === opt.val && styles.activeText]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: SIZES.radius,
    padding: 4,
    marginBottom: SIZES.padding,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: SIZES.radius - 4,
  },
  activeButton: {
    backgroundColor: COLORS.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  text: { color: COLORS.textLight, fontWeight: '600' },
  activeText: { color: COLORS.primary },
});
