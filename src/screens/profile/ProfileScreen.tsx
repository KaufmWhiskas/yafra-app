import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';
import { logout } from '../../services/authService';
import { fetchUserProfile, UserProfile } from '../../services/profileService';
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
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [bookmarks, setBookmarks] = useState<Restaurant[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

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

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        getBookmarks(user.id)
          .then((data) => {
            // Deduplicate the array by ID to prevent flatlist key errors
            const uniqueBookmarks = Array.from(
              new Map(data.map((item) => [item.id.toString(), item])).values(),
            );

            setBookmarks(uniqueBookmarks);
            setBookmarkedIds(
              new Set(uniqueBookmarks.map((b) => b.id.toString())),
            );
          })
          .catch((error) => console.error('Failed to load bookmarks:', error));
      }
    }, [user?.id]),
  );

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
