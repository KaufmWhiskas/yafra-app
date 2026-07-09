import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Very light tick. Perfect for scrolling through lists, changing slider values,
 * or moving a dial.
 */
export const hapticSelection = () => {
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync();
  }
};

/**
 * Physical impact bumps.
 * Light: standard taps.
 * Medium: Toggling switches, bookmarking.
 * Heavy: Destructive actions, structural UI changes (like our 1.0 crumble).
 */
export const hapticImpact = (
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

/**
 * System-level notification patterns.
 * Success: Form submitted, 5.0 achieved.
 * Warning: Invalid input.
 * Error: Deletion, failure.
 */
export const hapticNotification = (
  type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType
    .Success,
) => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(type);
  }
};
