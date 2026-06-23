import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  sendPasswordResetOtp,
  verifyResetOtp,
} from '../../services/authService';
import { COLORS, SIZES } from '../../constants/theme';
import OtpInput from '../../components/ui/OtpInput';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordResetOtp(email);
      setStep('otp');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await verifyResetOtp(email, otp);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Invalid or expired code.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter your email to receive a verification code.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        testID="email-input"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleSendCode}
        disabled={isLoading}
        testID="send-code-button"
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Code</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderOtpStep = () => (
    <>
      <Text style={styles.title}>Enter Code</Text>
      <Text style={styles.subtitle}>A 6-digit code was sent to {email}.</Text>
      <OtpInput length={6} value={otp} onChangeText={setOtp} />
      <TouchableOpacity
        style={styles.button}
        onPress={handleVerifyCode}
        disabled={isLoading || otp.length !== 6}
        testID="verify-code-button"
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {error && <Text style={styles.errorText}>{error}</Text>}
      {step === 'email' && renderEmailStep()}
      {step === 'otp' && renderOtpStep()}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>Back to Login</Text>
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
  backButton: {
    marginTop: SIZES.padding * 2,
  },
  backButtonText: {
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
