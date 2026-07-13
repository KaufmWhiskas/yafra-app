import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Achievement } from '../../types/achievements';
import { COLORS, SIZES } from '../../constants/theme';

interface AchievementBadgeProps {
  achievement: Achievement;
  isUnlocked: boolean;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  isUnlocked,
}) => {
  const isSecretAndLocked = achievement.is_secret && !isUnlocked;

  if (isSecretAndLocked) {
    return (
      <View style={[styles.container, styles.lockedContainer]}>
        <MaterialCommunityIcons
          name="lock-question"
          size={32}
          color={COLORS.textLight}
        />
        <Text style={styles.lockedTitle}>???</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, !isUnlocked && styles.lockedContainer]}>
      <MaterialCommunityIcons
        name={achievement.icon_name}
        size={32}
        color={isUnlocked ? COLORS.primary : COLORS.textLight}
      />
      <Text
        style={[styles.title, !isUnlocked && styles.lockedTitle]}
        numberOfLines={2}
      >
        {achievement.title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.base,
    marginRight: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lockedContainer: {
    opacity: 0.6,
    backgroundColor: '#f8f9fa',
  },
  title: {
    marginTop: SIZES.base,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.text,
  },
  lockedTitle: {
    color: COLORS.textLight,
  },
});

export default AchievementBadge;
