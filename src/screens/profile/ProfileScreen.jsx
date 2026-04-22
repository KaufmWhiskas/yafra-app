import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';
import { logout } from '../../services/authService';

/**
 * Displays the user's profile information and provides logout functionality.
 * Allows authenticated users to securely log out of the application.
 */
export default function ProfileScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      Alert.alert(
        'Logout Failed',
        error instanceof Error ? error.message : 'An error occurred',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Screen</Text>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        testID="logout-button"
        disabled={isLoading}
      >
        <Text style={styles.logoutButtonText}>
          {isLoading ? 'Logging Out...' : 'Logout'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding * 2,
  },
  logoutButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    minWidth: 150,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
