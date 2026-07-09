import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { globalHapticConfig, hapticImpact } from '../../utils/haptics';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/theme'; // Import Enums

const HAPTICS_ENABLED_KEY = '@haptics_enabled';

function HapticSettingRow() {
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(HAPTICS_ENABLED_KEY);
        const isEnabled = storedValue !== null ? JSON.parse(storedValue) : true;
        globalHapticConfig.isEnabled = isEnabled;
        setHapticsEnabled(isEnabled);
      } catch {
        // Fallback to default if loading fails
        setHapticsEnabled(true);
      }
    };
    loadPreference();
  }, []);

  const toggleHaptics = async (newValue: boolean) => {
    // 1. Update the global config immediately so the next line actually fires
    globalHapticConfig.isEnabled = newValue;
    setHapticsEnabled(newValue);

    // 2. Heavy impact ONLY when turning ON
    if (newValue) {
      hapticImpact(Haptics.ImpactFeedbackStyle.Heavy);
    }

    try {
      // Persist the change
      await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, JSON.stringify(newValue));
    } catch (e) {
      console.error('Failed to save haptic setting', e);
    }
  };

  if (hapticsEnabled === null) {
    return <ActivityIndicator size="small" color={COLORS.primary} />;
  }

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Haptic Feedback</Text>
      <Switch value={hapticsEnabled} onValueChange={toggleHaptics} />
    </View>
  );
}

export default function AccessibilitySettingsScreen() {
  return (
    <View style={styles.container}>
      <HapticSettingRow />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
  },
  label: { fontSize: 16, fontWeight: '600' },
});
