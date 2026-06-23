import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { updateUserPassword } from '../../services/authService';
import { COLORS, SIZES } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function UpdatePasswordScreen() {
  const navigation = useNavigation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requiresPasswordReset, setRequiresPasswordReset } = useAuth();

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await updateUserPassword(password);
      Alert.alert('Success', 'Your password has been updated successfully.', [
        {
          text: 'OK',
          onPress: () => {
            if (requiresPasswordReset) {
              setRequiresPasswordReset(false);
            } else {
              navigation.goBack();
            }
          },
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update password.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>Set New Password</Text>
      <Text style={styles.subtitle}>
        For your security, please update your password.
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TextInput
        style={styles.input}
        placeholder="New Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="password-input"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        testID="confirm-password-input"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleUpdatePassword}
        disabled={isLoading}
        testID="update-password-button"
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Update Password</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SIZES.padding * 2,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SIZES.base,
  },
  subtitle: {
    fontSize: SIZES.body3,
    textAlign: 'center',
    color: COLORS.textLight,
    marginBottom: SIZES.padding * 2,
  },
  input: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    fontSize: SIZES.body3,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: SIZES.base,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: SIZES.h4,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
});
