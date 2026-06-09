import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';
import {
  logout,
  fetchUserProfile,
  updateUsername,
} from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { getBookmarks, toggleBookmark } from '../../services/bookmarkService';
import { Restaurant } from '../../types';
import RestaurantList from '../../components/ui/RestaurantList';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

/**
 * Displays the user's profile information, statistics, and provides logout functionality.
 */
export default function ProfileScreen() {
  const { session } = useAuth();
  const user = session?.user;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Restaurant[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      const loadProfileData = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
          const profile = await fetchUserProfile(user.id);
          if (profile?.username) {
            setUsername(profile.username);
          }

          const data = await getBookmarks(user.id);
          const uniqueBookmarks = Array.from(
            new Map(data.map((item) => [item.id.toString(), item])).values(),
          );
          setBookmarks(uniqueBookmarks);
          setBookmarkedIds(
            new Set(uniqueBookmarks.map((b) => b.id.toString())),
          );
        } catch (error) {
          console.error('Failed to load profile data:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadProfileData();
    }, [user?.id]),
  );

  const handleSaveUsername = async () => {
    if (!user?.id || !username.trim()) return;
    try {
      await updateUsername(user.id, username.trim());
      Alert.alert('Success', 'Username updated successfully!');
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === '23505') {
        Alert.alert(
          'Username Taken',
          'That username is already in use. Please choose another.',
        );
      } else {
        Alert.alert(
          'Update Failed',
          err.message || 'An error occurred while updating username.',
        );
      }
    }
  };

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

  const handleReviewPress = (restaurant: Restaurant) => {
    navigation.navigate('ReviewScreen', { restaurant });
  };

  const handleToggleBookmark = async (restaurantId: string | number) => {
    if (!user?.id) return;
    const idStr = restaurantId.toString();

    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) next.delete(idStr);
      else next.add(idStr);
      return next;
    });

    setBookmarks((prev) => prev.filter((b) => b.id.toString() !== idStr));

    try {
      await toggleBookmark(restaurantId, user.id);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile Settings</Text>

        <View style={styles.settingsContainer}>
          <Text style={styles.label}>Username</Text>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="none"
            />
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveUsername}
            disabled={isLoading || !username.trim()}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>

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

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>My Saved Places</Text>
        <RestaurantList
          restaurants={bookmarks}
          bookmarkedIds={bookmarkedIds}
          onPressReview={handleReviewPress}
          onToggleBookmark={handleToggleBookmark}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SIZES.padding + 20, // + 20 buffer for the status bar / notch
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  settingsContainer: {
    width: '100%',
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding * 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: SIZES.base,
    padding: 12,
    marginBottom: SIZES.padding,
    color: COLORS.text,
    fontSize: 16,
  },
  loadingText: {
    marginBottom: SIZES.padding,
    color: COLORS.textLight,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: COLORS.textLight, // muted color for logout since Save is primary
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
  listContainer: {
    flex: 1,
    width: '100%',
    marginTop: SIZES.padding,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
    paddingHorizontal: SIZES.padding,
  },
});
