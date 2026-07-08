import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { getScoreColor, getScoreDescriptor } from '../../utils/scoreEngine';
import { COLORS, SIZES } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ScoreSelectorProps {
  value: number;
  onChange: (score: number) => void;
  label?: string;
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
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toFixed(1));
    }
  }, [value, isFocused]);

  const handleIncrement = () =>
    onChange(Math.min(5.0, Math.round((value + 0.1) * 10) / 10));

  const handleDecrement = () => {
    onChange(Math.max(1.0, Math.round((value - 0.1) * 10) / 10));
  };

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

      <Text
        testID="score-descriptor"
        style={[styles.descriptor, { color: scoreColor }]}
      >
        {descriptor}
      </Text>
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
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    minWidth: 240,
    justifyContent: 'space-between',
  },
  button: { padding: SIZES.base, zIndex: 10 },
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
    minWidth: 50,
    marginHorizontal: 4,
  },
  descriptor: { marginTop: SIZES.base, fontSize: 16, fontWeight: '600' },
});
