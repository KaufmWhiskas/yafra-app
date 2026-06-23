import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, Keyboard } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

interface OtpInputProps {
  length: number;
  value: string;
  onChangeText: (text: string) => void;
}

export default function OtpInput({
  length,
  value,
  onChangeText,
}: OtpInputProps) {
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleTextChange = (text: string, index: number) => {
    // Handle paste
    if (text.length > 1) {
      const pasted = text.slice(0, length);
      onChangeText(pasted);
      const nextIndex = pasted.length;
      if (nextIndex < length) {
        inputs.current[nextIndex]?.focus();
      } else {
        Keyboard.dismiss();
      }
      return;
    }

    const newValue = value.padEnd(length, ' ').split('');
    newValue[index] = text || ' ';
    onChangeText(newValue.join('').trimEnd());

    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number,
  ) => {
    const isEmpty = !value[index] || value[index] === ' ';

    if (e.nativeEvent.key === 'Backspace' && isEmpty && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        // 1. Check if the char exists AND is not our space placeholder
        const char = value[index] && value[index] !== ' ' ? value[index] : '';

        return (
          <TextInput
            key={index}
            testID={`otp-input-${index}`}
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
            style={[styles.cell, char ? styles.cellFilled : null]}
            value={char}
            onChangeText={(text) => handleTextChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            maxLength={length}
            selectTextOnFocus
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SIZES.padding,
  },
  cell: {
    width: 48,
    height: 56,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cellFilled: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
});
