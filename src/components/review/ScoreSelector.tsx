import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { COLORS, SIZES } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ScoreSelectorProps {
  value: number;
  onChange: (score: number) => void;
  label?: string;
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
}: ScoreSelectorProps) {
  const scoreColor = getScoreColor(value);
  const descriptor = getScoreDescriptor(value);

  const [inputValue, setInputValue] = useState(value.toFixed(1));
  const [isFocused, setIsFocused] = useState(false);
  const [sparks, setSparks] = useState<ActiveSpark[]>([]);

  const delighterScale = useRef(new Animated.Value(1)).current;
  const loopActiveRef = useRef(false);

  const valueRef = useRef(value);
  valueRef.current = value;

  const spawnSparkInstance = useCallback(() => {
    // Spawns randomly across the full 240px x 54px control bar canvas frame
    const startX = Math.random() * 240 - 120;
    const startY = Math.random() * 54 - 27;

    const spark: ActiveSpark = {
      id: Math.random() + Date.now(),
      startX,
      startY,
      animX: new Animated.Value(0),
      animY: new Animated.Value(0),
      opacity: new Animated.Value(1),
      size: Math.random() * 3.5 + 2.5,
    };

    setSparks((prev) => [...prev, spark]);

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 40 + 25;
    const targetX = Math.cos(angle) * distance;
    const targetY = Math.sin(angle) * distance + 20;

    Animated.parallel([
      Animated.timing(spark.animX, {
        toValue: targetX,
        duration: 750,
        useNativeDriver: true,
      }),
      Animated.timing(spark.animY, {
        toValue: targetY,
        duration: 750,
        useNativeDriver: true,
      }),
      Animated.timing(spark.opacity, {
        toValue: 0,
        duration: 750,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSparks((prev) => prev.filter((s) => s.id !== spark.id));
    });
  }, []);

  useEffect(() => {
    let frameId: number;
    let lastSpawnTime = 0;

    const tick = (timestamp: number) => {
      if (!loopActiveRef.current) return;

      if (timestamp - lastSpawnTime > 50) {
        spawnSparkInstance();
        lastSpawnTime = timestamp;
      }
      frameId = requestAnimationFrame(tick);
    };

    if (value === 5.0) {
      if (!loopActiveRef.current) {
        loopActiveRef.current = true;
        frameId = requestAnimationFrame(tick);

        Animated.sequence([
          Animated.timing(delighterScale, {
            toValue: 1.15,
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
      }
    } else {
      loopActiveRef.current = false;
      setSparks([]);
    }

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [value, spawnSparkInstance, delighterScale]);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toFixed(1));
    }
  }, [value, isFocused]);

  const handleIncrement = () =>
    onChange(Math.min(5.0, Math.round((value + 0.1) * 10) / 10));

  const handleDecrement = () =>
    onChange(Math.max(1.0, Math.round((value - 0.1) * 10) / 10));

  const handleChangeText = (text: string) => {
    setInputValue(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed) && parsed >= 1.0 && parsed <= 5.0) {
      onChange(Math.round(parsed * 10) / 10);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed) || parsed < 1.0) {
      onChange(1.0);
      setInputValue('1.0');
    } else if (parsed > 5.0) {
      onChange(5.0);
      setInputValue('5.0');
    } else {
      const clamped = Math.round(parsed * 10) / 10;
      onChange(clamped);
      setInputValue(clamped.toFixed(1));
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2;
      },
      onPanResponderMove: (_, gestureState) => {
        const scaleFactor = 15;
        const stepDelta = Math.round(gestureState.dx / scaleFactor);

        if (stepDelta !== 0) {
          const nextValue = valueRef.current + stepDelta * 0.1;
          const clampedValue = Math.min(
            5.0,
            Math.max(1.0, Math.round(nextValue * 10) / 10),
          );

          if (clampedValue !== valueRef.current) {
            onChange(clampedValue);
            gestureState.dx = 0;
          }
        }
      },
      onPanResponderRelease: () => {},
    }),
  ).current;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.wrapperAnchor}>
        {sparks.map((s) => (
          <Animated.View
            key={s.id}
            style={[
              styles.sparkElement,
              {
                width: s.size,
                height: s.size,
                borderRadius: s.size / 2,
                opacity: s.opacity,
                transform: [
                  { translateX: s.startX },
                  { translateY: s.startY },
                  { translateX: s.animX },
                  { translateY: s.animY },
                ],
              },
            ]}
          />
        ))}

        <View
          {...panResponder.panHandlers}
          style={[styles.controlRow, { backgroundColor: scoreColor }]}
        >
          <TouchableOpacity
            testID="decrement-btn"
            onPress={handleDecrement}
            style={styles.button}
          >
            <MaterialCommunityIcons
              name="minus"
              size={24}
              color={COLORS.surface}
            />
          </TouchableOpacity>

          <View style={styles.swipeContainer}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={18}
              color="rgba(255,255,255,0.6)"
            />
            <TextInput
              testID="score-input"
              style={styles.input}
              value={inputValue}
              onChangeText={handleChangeText}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
              keyboardType="numeric"
              maxLength={3}
              underlineColorAndroid="transparent"
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
            <MaterialCommunityIcons
              name="plus"
              size={24}
              color={COLORS.surface}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.Text
        testID="score-descriptor"
        style={[
          styles.descriptor,
          {
            color: scoreColor,
            transform: [{ scale: delighterScale }],
          },
        ]}
      >
        {value === 5.0 ? `✨ ${descriptor} ✨` : descriptor}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SIZES.base,
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  wrapperAnchor: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 240,
    height: 54,
  },
  sparkElement: {
    position: 'absolute',
    backgroundColor: '#86efac',
    zIndex: 15,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.base,
    width: 240,
    height: 54,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  button: {
    padding: SIZES.base,
    zIndex: 11,
  },
  swipeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.surface,
    textAlign: 'center',
    minWidth: 56,
    marginHorizontal: 4,
    padding: 0,
    height: '100%',
  },
  descriptor: {
    marginTop: SIZES.base,
    fontSize: 16,
    fontWeight: '600',
  },
});
