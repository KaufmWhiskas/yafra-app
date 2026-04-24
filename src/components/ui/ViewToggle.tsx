import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

interface ViewToggleProps {
  viewMode: string;
  onToggle: (mode: string) => void;
}

export default function ViewToggle({ viewMode, onToggle }: ViewToggleProps) {
  return (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[styles.toggleBtn, viewMode === 'map' && styles.activeBtn]}
        onPress={() => onToggle('map')}
      >
        <Text
          style={[styles.toggleText, viewMode === 'map' && styles.activeText]}
        >
          Map View
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.toggleBtn, viewMode === 'list' && styles.activeBtn]}
        onPress={() => onToggle('list')}
      >
        <Text
          style={[styles.toggleText, viewMode === 'list' && styles.activeText]}
        >
          List View
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.largeRadius,
    padding: 4,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: SIZES.largeRadius,
  },
  activeBtn: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  activeText: {
    color: COLORS.surface,
  },
});
