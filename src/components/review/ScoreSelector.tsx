import React, { useState, useEffect, useRef, useCallback } from 'react';
import Svg, { Path } from 'react-native-svg';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  PanResponder,
  Animated,
} from 'react-native';
import { getScoreColor, getScoreDescriptor } from '../../utils/scoreEngine';
import { SIZES } from '../../constants/theme';
import {
  hapticSelection,
  hapticImpact,
  hapticNotification,
} from '../../utils/haptics';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ScoreSelectorProps {
  value: number;
  onChange: (score: number) => void;
  label?: string;
  testID?: string;
}

interface ActiveSpark {
  id: number;
  startX: number;
  startY: number;
  animX: Animated.Value;
  animY: Animated.Value;
  opacity: Animated.Value;
  size: number;
}

export default function ScoreSelector({
  value,
  onChange,
  label = 'Rating',
  testID,
}: ScoreSelectorProps) {
  const scoreColor = getScoreColor(value);
  const descriptor = getScoreDescriptor(value);

  const [sparks, setSparks] = useState<ActiveSpark[]>([]);

  const delighterScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const crumbleScale = useRef(new Animated.Value(1)).current;
  const erosionAnim = useRef(new Animated.Value(0)).current;

  const isFirstMount = useRef(true);

  const valueRef = useRef(value);
  valueRef.current = value;

  const triggerSpringScale = useCallback(() => {
    // This is for the descriptor text, not the crumble effect
    Animated.sequence([
      Animated.timing(delighterScale, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(delighterScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delighterScale]);

  // Triggers visual state transitions for both buttons and swipes
  const triggerVisualState = useCallback(
    (val: number) => {
      const isInitialRender = isFirstMount.current;
      isFirstMount.current = false;

      if (val === 5.0) {
        if (!isInitialRender)
          hapticNotification(Haptics.NotificationFeedbackType.Success); // Bright, resolving vibration
        Animated.timing(erosionAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
        triggerSpringScale();
      } else if (val === 1.0) {
        if (!isInitialRender) hapticImpact(Haptics.ImpactFeedbackStyle.Heavy); // Heavy, dull thud for the structural break
        Animated.parallel([
          Animated.timing(erosionAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: false,
          }),
          // Animate the crumble scale and shake
          Animated.sequence([
            Animated.timing(crumbleScale, {
              toValue: 0.97,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.spring(crumbleScale, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(shakeAnim, {
              toValue: 8,
              duration: 40,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: -8,
              duration: 40,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
              toValue: 0,
              duration: 40,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
        triggerSpringScale();
      } else {
        if (!isInitialRender) hapticSelection(); // The subtle mechanical "click" for every 0.1 step
        Animated.timing(erosionAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    },
    [shakeAnim, erosionAnim, triggerSpringScale, crumbleScale],
  );

  useEffect(() => {
    triggerVisualState(value);
  }, [value, triggerVisualState]);

  const spawnSparkInstance = useCallback(() => {
    const startX = Math.random() * 240 - 120;
    const startY = Math.random() * 54 - 27;
    const spark: ActiveSpark = {
      id: Math.random() + Date.now(),
      startX,
      startY,
      animX: new Animated.Value(startX),
      animY: new Animated.Value(startY),
      opacity: new Animated.Value(1),
      size: Math.random() * 3.5 + 2.5,
    };
    setSparks((prev) => [...prev, spark]);
    Animated.parallel([
      Animated.timing(spark.animX, {
        toValue: startX + (Math.random() - 0.5) * 40,
        duration: 750,
        useNativeDriver: true,
      }),
      Animated.timing(spark.animY, {
        toValue: startY + (Math.random() - 0.5) * 40,
        duration: 750,
        useNativeDriver: true,
      }),
      Animated.timing(spark.opacity, {
        toValue: 0,
        duration: 750,
        useNativeDriver: true,
      }),
    ]).start(() => setSparks((prev) => prev.filter((s) => s.id !== spark.id)));
  }, []);

  useEffect(() => {
    let frameId: number;
    let lastSpawnTime = 0;
    const tick = (timestamp: number) => {
      if (value === 5.0) {
        if (timestamp - lastSpawnTime > 33) {
          spawnSparkInstance();
          lastSpawnTime = timestamp;
        }
        frameId = requestAnimationFrame(tick);
      }
    };
    if (value === 5.0) {
      frameId = requestAnimationFrame(tick);
    } else {
      setSparks([]); // Clear immediately when leaving 5.0
    }
    return () => cancelAnimationFrame(frameId);
  }, [value, spawnSparkInstance]);

  const handleIncrement = () =>
    onChange(Math.min(5.0, Math.round((value + 0.1) * 10) / 10));

  const handleDecrement = () =>
    onChange(Math.max(1.0, Math.round((value - 0.1) * 10) / 10));

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5,
      onPanResponderMove: (_, gesture) => {
        // Normalizing: 30 pixels equals exactly one 0.1 increment
        const step = Math.round(gesture.dx / 15);
        if (step !== 0) {
          const nextValue = Math.min(
            5.0,
            Math.max(1.0, valueRef.current + step * 0.1),
          );
          onChange(Math.round(nextValue * 10) / 10);
          gesture.dx = 0; // Reset allows the next "step" to be calculated from here
        }
      },
    }),
  ).current;

  // Define SVG paths for the different states
  const normalPath = `M12,0 L228,0 A12,12 0 0 1 240,12 L240,42 A12,12 0 0 1 228,54 L12,54 A12,12 0 0 1 0,42 L0,12 A12,12 0 0 1 12,0 Z`;
  const brokenPath = `M12,0 L80,2 L100,5 L160,3 L220,8 L230,4 L235,15 L238,35 L232,48 L220,52 L160,50 L100,54 L40,50 L10,54 A12,12 0 0 1 0,42 L0,12 A12,12 0 0 1 12,0 Z`;

  const crackPaths = [
    { d: 'M120,10 L140,30 L135,45', highlight: 'M121,10 L141,30 L136,45' },
    { d: 'M150,5 L160,30', highlight: 'M151,5 L161,30' },
    { d: 'M80,54 L90,30 L100,35', highlight: 'M81,54 L91,30 L101,35' },
    { d: 'M90,30 L85,15', highlight: 'M91,30 L86,15' },
  ];

  const crackOpacity = erosionAnim;

  return (
    <View style={styles.container} testID={testID}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.wrapperAnchor}>
        <Animated.View
          style={[
            styles.controlRow,
            {
              transform: [{ translateX: shakeAnim }, { scale: crumbleScale }],
            },
          ]}
        >
          <Animated.View
            style={{
              ...StyleSheet.absoluteFillObject,
              transform: [],
            }}
          >
            <Svg width="240" height="54" style={StyleSheet.absoluteFill}>
              <Path
                d={value === 1.0 ? brokenPath : normalPath}
                fill={scoreColor}
              />
            </Svg>

            <Animated.View
              style={{
                ...StyleSheet.absoluteFillObject,
                opacity: crackOpacity,
              }}
            >
              <Svg width="240" height="54">
                {crackPaths.map((p, i) => (
                  <React.Fragment key={i}>
                    <Path
                      d={p.d}
                      stroke="rgba(0,0,0,0.35)"
                      strokeWidth={2}
                      fill="none"
                    />
                    <Path
                      d={p.highlight}
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth={1}
                      fill="none"
                    />
                  </React.Fragment>
                ))}
              </Svg>
            </Animated.View>
          </Animated.View>

          <TouchableOpacity
            testID="decrement-btn"
            onPress={handleDecrement}
            style={styles.button}
          >
            <MaterialCommunityIcons name="minus" size={24} color="white" />
          </TouchableOpacity>
          <View {...panResponder.panHandlers} style={styles.swipeContainer}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={18}
              color="rgba(255,255,255,0.6)"
            />
            <TextInput
              testID="score-input"
              style={styles.input}
              value={value.toFixed(1)}
              editable={false}
            />
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color="rgba(255,255,255,0.6)"
            />
          </View>
          <TouchableOpacity
            testID="increment-btn"
            onPress={handleIncrement}
            style={styles.button}
          >
            <MaterialCommunityIcons name="plus" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>

        {sparks.map((s) => (
          <Animated.View
            key={s.id}
            style={[
              styles.particleElement,
              {
                left: '50%', // Position in the center of the anchor
                top: '50%',
                opacity: s.opacity,
                transform: [{ translateX: s.animX }, { translateY: s.animY }],
              },
            ]}
          />
        ))}
      </View>

      <Animated.Text
        testID="score-descriptor"
        style={[styles.descriptor, { transform: [{ scale: delighterScale }] }]}
      >
        {value === 1.0
          ? `☣️ ${descriptor} ☣️`
          : value === 5.0
            ? `✨ ${descriptor} ✨`
            : descriptor}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: SIZES.base, alignItems: 'center' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  wrapperAnchor: { width: 240, height: 54, justifyContent: 'center' },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 240,
    height: 54,
  },
  particleElement: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#86efac',
  },
  input: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    minWidth: 56,
    marginHorizontal: 4,
  },
  button: { padding: 16 },
  descriptor: { marginTop: 8, fontSize: 16, fontWeight: '600' },
  swipeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
