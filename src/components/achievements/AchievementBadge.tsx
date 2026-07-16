import React, { ComponentProps } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  MaterialCommunityIcons,
  FontAwesome5,
  Ionicons,
} from '@expo/vector-icons';
import Lucide from '@react-native-vector-icons/lucide';
import { Achievement } from '../../types/achievements';
import { COLORS, SIZES } from '../../constants/theme';

interface AchievementBadgeProps {
  achievement: Achievement;
  isUnlocked: boolean;
}

type IoniconsName = ComponentProps<typeof Ionicons>['name'];
type LucideName = ComponentProps<typeof Lucide>['name'];
type MaterialCommunityIconsName = ComponentProps<
  typeof MaterialCommunityIcons
>['name'];

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  isUnlocked,
}) => {
  const isSecretAndLocked = achievement.is_secret && !isUnlocked;
  const color = isUnlocked ? COLORS.primary : COLORS.textLight;

  const renderIcon = () => {
    if (isSecretAndLocked) {
      return (
        <MaterialCommunityIcons name="lock-question" size={32} color={color} />
      );
    }

    // Split the string. E.g. "fa5:utensils" -> family: "fa5", iconName: "utensils"
    // Default to 'mci' if no prefix is found for backwards compatibility.
    const [family, iconName] = achievement.icon_name.includes(':')
      ? achievement.icon_name.split(':')
      : ['mci', achievement.icon_name];

    switch (family) {
      case 'fa5':
        return <FontAwesome5 name={iconName} size={28} color={color} />;
      case 'ion':
        return (
          <Ionicons name={iconName as IoniconsName} size={32} color={color} />
        );
      case 'lucide':
        return <Lucide name={iconName as LucideName} size={32} color={color} />;
      case 'mci':
      default:
        return (
          <MaterialCommunityIcons
            name={iconName as MaterialCommunityIconsName}
            size={32}
            color={color}
          />
        );
    }
  };

  return (
    <View style={[styles.container, !isUnlocked && styles.lockedContainer]}>
      {renderIcon()}
      <Text
        style={[styles.title, !isUnlocked && styles.lockedTitle]}
        numberOfLines={2}
      >
        {isSecretAndLocked ? '???' : achievement.title}
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
