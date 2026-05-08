import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';
import { logout } from '../../services/authService';
import { fetchUserProfile, UserProfile } from '../../services/profileService';

/**
 * Displays the user's profile information, statistics, and provides logout functionality.
 */
export default function ProfileScreen() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchUserProfile();
        setProfileData(data);
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      Alert.alert(
        'Logout Failed',
        error instanceof Error ? error.message : 'An error occurred',
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Screen</Text>

      {profileData ? (
        <View style={styles.statsContainer}>
          <Text style={styles.emailText}>{profileData.email}</Text>
          <Text style={styles.statsText}>
            Total Reviews: {profileData.reviewCount}
          </Text>
        </View>
      ) : (
        <Text style={styles.loadingText}>Loading profile...</Text>
      )}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        testID="logout-button"
        disabled={isLoggingOut}
      >
        <Text style={styles.logoutButtonText}>
          {isLoggingOut ? 'Logging Out...' : 'Logout'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ... (rest of the StyleSheet) ...
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
    marginBottom: SIZES.padding,
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    elevation: 2,
    width: '80%',
  },
  emailText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  statsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  loadingText: {
    marginBottom: SIZES.padding * 2,
    color: COLORS.text,
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
