import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { register } from '../../services/authService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

/**
 * Provides the user interface for new account creation.
 * Captures email and password, and allows navigation back to the login flow.
 */
export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      console.error('Passwords do not match');
      return;
    }

    try {
      await register(email, password);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleLogin = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleLogin}
        testID="close-back-button"
      >
        <Ionicons name="close" size={28} color={COLORS.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Register</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        placeholderTextColor={COLORS.textLight}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={COLORS.textLight}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor={COLORS.textLight}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleRegister}
        testID="register-submit-button"
      >
        <Text style={styles.actionButtonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogin}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: SIZES.padding,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    color: COLORS.text,
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: COLORS.primary,
    textAlign: 'center',
    fontSize: 14,
  },
});
