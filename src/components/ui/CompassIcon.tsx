import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface CompassIconProps {
  rotation: number;
}

export default function CompassIcon({ rotation }: CompassIconProps) {
  return (
    <View style={styles.container}>
      <View style={styles.ring} />

      <View
        style={[
          styles.needleContainer,
          { transform: [{ rotate: `${rotation}deg` }] },
        ]}
      >
        <View style={styles.northNeedleBorder} />
        <View style={styles.southNeedleBorder} />

        <View style={styles.northNeedleFill} />
        <View style={styles.southNeedleFill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgb(255, 255, 255)',
    backgroundColor: 'transparent',
  },
  needleContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  northNeedleBorder: {
    position: 'absolute',
    top: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 16,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.surface,
  },
  southNeedleBorder: {
    position: 'absolute',
    bottom: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 16,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.surface,
  },

  northNeedleFill: {
    position: 'absolute',
    top: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 14,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.primary,
  },
  southNeedleFill: {
    position: 'absolute',
    bottom: 2,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 14,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.textLight,
  },
});
