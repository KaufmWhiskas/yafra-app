import React from 'react';
import { TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

interface RouteButtonProps {
  latitude: number;
  longitude: number;
  label: string;
}

export default function RouteButton({
  latitude,
  longitude,
  label,
}: RouteButtonProps) {
  const handlePress = () => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${latitude},${longitude}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) Linking.openURL(url);
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      testID="route-button"
    >
      <MaterialCommunityIcons name="directions" size={24} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});
