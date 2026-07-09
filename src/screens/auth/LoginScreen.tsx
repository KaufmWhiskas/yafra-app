import { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Used for social brand icons
import { COLORS, SIZES } from '../../constants/theme';
import { hapticNotification } from '../../utils/haptics';
import { login, signInWithProvider } from '../../services/authService';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

/**
 * Provides a user interface for existing users to authenticate.
 * Includes traditional credential inputs alongside third-party OAuth channels.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogin = async () => {
    try {
      await login(email.trim(), password);
    } catch (error) {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Login Failed',
        error instanceof Error ? error.message : 'An error occurred',
      );
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'discord') => {
    try {
      await signInWithProvider(provider);
      // The application session handles updating the root layout tree automatically
    } catch (error) {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Authentication Failed',
        error instanceof Error ? error.message : 'An error occurred',
      );
    }
  };

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholderTextColor={COLORS.textLight}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={COLORS.textLight}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          testID="login-submit-button"
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* SOCIAL SPLIT DIVIDER */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or connect with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* OAUTH BUTTON CONTAINER MATRIX */}
        <View style={styles.oauthRow}>
          <TouchableOpacity
            style={[styles.oauthButton, styles.googleButton]}
            onPress={() => handleOAuthLogin('google')}
            testID="google-login-button"
          >
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text style={styles.oauthButtonText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.oauthButton, styles.discordButton]}
            onPress={() => handleOAuthLogin('discord')}
            testID="discord-login-button"
          >
            <Ionicons name="logo-discord" size={20} color="#fff" />
            <Text style={styles.oauthButtonText}>Discord</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSignUp}>
          <Text style={styles.linkText}>Don't have an account?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.linkText}>Forgot Password</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SIZES.padding,
    paddingTop: 40,
    paddingBottom: SIZES.padding * 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    fontSize: 16,
    color: COLORS.text,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SIZES.padding,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SIZES.padding,
    color: COLORS.textLight,
    fontSize: 14,
  },
  oauthRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SIZES.padding * 1.5,
  },
  oauthButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: SIZES.padding - 2,
    borderRadius: SIZES.radius,
  },
  googleButton: {
    backgroundColor: '#DB4437', // Official Google Hex Brand Target
  },
  discordButton: {
    backgroundColor: '#5865F2', // Official Discord Hex Brand Target
  },
  oauthButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  linkText: {
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SIZES.padding,
    fontSize: 14,
  },
});
