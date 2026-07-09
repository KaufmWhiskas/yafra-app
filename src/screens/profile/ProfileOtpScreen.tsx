import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { verifyResetOtp } from '../../services/authService';
import { hapticNotification } from '../../utils/haptics';
import * as Haptics from 'expo-haptics';
import { COLORS, SIZES } from '../../constants/theme';
import OtpInput from '../../components/ui/OtpInput';
import { RootStackParamList } from '../../types/navigation';

type ProfileOtpScreenRouteProp = RouteProp<
  RootStackParamList,
  'ProfileOtpScreen'
>;

export default function ProfileOtpScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ProfileOtpScreenRouteProp>();
  const { email } = route.params;

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await verifyResetOtp(email, otp);
      navigation.navigate('UpdatePasswordScreen');
    } catch (err) {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      const message =
        err instanceof Error ? err.message : 'Invalid or expired code.';
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
      <Text style={styles.title}>Enter Code</Text>
      <Text style={styles.subtitle}>A 6-digit code was sent to {email}.</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>Back</Text>
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
