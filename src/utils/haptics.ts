import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTICS_ENABLED_KEY = '@haptics_enabled';

/**
 * Global in-memory configuration for haptic feedback. This object is mutated
 * directly by `initHapticsConfig` and the settings screen.
 */
export const globalHapticConfig = {
  /** Whether haptics are currently enabled. Defaults to true. */
  isEnabled: true,
};

/**
 * Initializes the haptic configuration by reading the user's preference from
 * AsyncStorage. This should be called once on app startup.
 */
export const initHapticsConfig = async () => {
  try {
    const storedValue = await AsyncStorage.getItem(HAPTICS_ENABLED_KEY);
    if (storedValue !== null) {
      globalHapticConfig.isEnabled = JSON.parse(storedValue);
    }
  } catch (e) {
    console.error('Failed to load haptic setting from storage', e);
  }
};

/**
 * Triggers a light haptic feedback for selection changes.
 *
 * Useful for scrolling through lists, changing slider values, or moving a dial.
 */
export const hapticSelection = () => {
  if (Platform.OS !== 'web' && globalHapticConfig.isEnabled) {
    Haptics.selectionAsync();
  }
};

/**
 * Triggers a haptic feedback impact of a given style.
 *
 * @param style The impact style. Defaults to 'Light'.
 *     - Light: Standard taps.
 *     - Medium: Toggling switches, bookmarking.
 *     - Heavy: Destructive actions or major UI changes.
 */
export const hapticImpact = (
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
) => {
  if (Platform.OS !== 'web' && globalHapticConfig.isEnabled) {
    Haptics.impactAsync(style);
  }
};

/**
 * Triggers a haptic feedback notification of a given type.
 *
 * @param type The notification type. Defaults to 'Success'.
 *     - Success: Successful actions, like form submission.
 *     - Warning: Potentially problematic but non-critical actions.
 *     - Error: Failed or destructive actions.
 */
export const hapticNotification = (
  type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType
    .Success,
) => {
  if (Platform.OS !== 'web' && globalHapticConfig.isEnabled) {
    Haptics.notificationAsync(type);
  }
};
