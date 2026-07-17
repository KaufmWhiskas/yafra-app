import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { hapticNotification } from '../utils/haptics';
import { Achievement } from '../types/achievements';

/**
 * Returns a controller for presenting multiple achievement unlocks sequentially,
 * ensuring that alerts do not suppress each other.
 */
export function useSequentialAlerts() {
  const presentUnlocks = async (achievements: Achievement[]) => {
    if (!achievements || achievements.length === 0) return;

    for (const ach of achievements) {
      await new Promise<void>((resolve) => {
        hapticNotification(Haptics.NotificationFeedbackType.Success);

        Alert.alert(
          '🏆 Achievement Unlocked!',
          `Congratulations! You've earned the "${ach.title}" badge.\n\n${ach.description}`,
          [
            {
              text: 'Awesome!',
              // Resolving the promise unblocks the `await` and allows the loop
              // to proceed to the next achievement alert.
              onPress: () => resolve(),
            },
          ],
          { cancelable: false },
        );
      });
    }
  };

  return { presentUnlocks };
}
