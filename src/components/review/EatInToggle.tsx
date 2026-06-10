import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

interface EatInToggleProps {
  isEatIn: boolean;
  onChange: (val: boolean) => void;
}

export default function EatInToggle({ isEatIn, onChange }: EatInToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isEatIn && styles.activeButton]}
        onPress={() => onChange(true)}
      >
        <Text style={[styles.text, isEatIn && styles.activeText]}>Dine In</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, !isEatIn && styles.activeButton]}
        onPress={() => onChange(false)}
      >
        <Text style={[styles.text, !isEatIn && styles.activeText]}>
          Takeaway
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: SIZES.radius,
    padding: 4,
    marginVertical: SIZES.base,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: SIZES.radius - 4,
  },
  activeButton: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: { color: COLORS.textLight, fontWeight: '600', fontSize: 16 },
  activeText: { color: COLORS.text, fontWeight: 'bold' },
});
