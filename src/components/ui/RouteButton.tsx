import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

interface RouteButtonProps {
  latitude: number;
  longitude: number;
  label: string;
  style?: StyleProp<ViewStyle>;
}

export default function RouteButton({
  latitude,
  longitude,
  label,
  style,
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
      style={[styles.button, style]}
      onPress={handlePress}
      testID="route-button"
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name="directions" size={26} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 16, // Clean structural rounded-square configuration matching main design FABs
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    bottom: 110, // Default fallback
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
    elevation: 6,
    zIndex: 999,
  },
});
