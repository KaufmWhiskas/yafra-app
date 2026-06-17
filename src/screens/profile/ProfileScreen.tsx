import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { fetchUserStats } from '../../services/profileService';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const user = session?.user;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    username: '',
    reviewCount: 0,
    uniqueRestaurantsVisited: 0,
    bookmarkCount: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;
      try {
        const data = await fetchUserStats(user.id);
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      Alert.alert(
        'Logout Failed',
        error instanceof Error ? error.message : 'An error occurred',
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={24}
            color={COLORS.text}
          />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.identityCard}>
          <View style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons
              name="account"
              size={40}
              color={COLORS.textLight}
            />
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.username}>
              {isLoading ? 'Loading...' : stats.username}
            </Text>
            <View style={styles.statsContainer}>
              <TouchableOpacity
                onPress={() => {
                  if (user?.id) {
                    navigation.navigate('UserReviewsScreen', {
                      userId: user.id,
                    });
                  }
                }}
              >
                <Text style={styles.statText}>
                  <Text style={styles.statBold}>
                    {isLoading ? '-' : stats.reviewCount}
                  </Text>{' '}
                  Reviews
                </Text>
              </TouchableOpacity>
              <Text style={styles.statText}>
                <Text style={styles.statBold}>
                  {isLoading ? '-' : stats.uniqueRestaurantsVisited}
                </Text>{' '}
                Restaurants Visited
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={COLORS.textLight}
          />
        </TouchableOpacity>

        <View style={styles.gridRow}>
          <TouchableOpacity style={[styles.gridCard, styles.gridCardLeft]}>
            <MaterialCommunityIcons
              name="trophy-outline"
              size={32}
              color={COLORS.primary}
              style={styles.gridIcon}
            />
            <Text style={styles.gridCardTitle}>Achievements</Text>
            <Text style={styles.gridCardSub}>Coming soon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardRight]}
            onPress={() => navigation.navigate('WantToVisitScreen')}
          >
            <MaterialCommunityIcons
              name="bookmark-outline"
              size={32}
              color={COLORS.bookmark}
              style={styles.gridIcon}
            />
            <Text style={styles.gridCardTitle}>Want to Visit</Text>
            <Text style={styles.gridCardSub}>
              {isLoading ? '-' : stats.bookmarkCount} places
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionMenu}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('EditProfileScreen')}
          >
            <MaterialCommunityIcons
              name="account-edit-outline"
              size={24}
              color={COLORS.text}
            />
            <Text style={styles.actionText}>Profile Edit</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={COLORS.textLight}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <MaterialCommunityIcons
              name="cog-outline"
              size={24}
              color={COLORS.text}
            />
            <Text style={styles.actionText}>Settings</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={COLORS.textLight}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <MaterialCommunityIcons
              name="shield-account-outline"
              size={24}
              color={COLORS.text}
            />
            <Text style={styles.actionText}>Privacy</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={COLORS.textLight}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <MaterialCommunityIcons
              name="information-outline"
              size={24}
              color={COLORS.text}
            />
            <Text style={styles.actionText}>About</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={COLORS.textLight}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionItem, styles.logoutItem]}
            onPress={handleLogout}
            testID="logout-button"
          >
            <MaterialCommunityIcons
              name="logout"
              size={24}
              color={COLORS.danger}
            />
            <Text style={[styles.actionText, styles.logoutText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  identityInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'column',
  },
  statText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  statBold: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding,
  },
  gridCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gridCardLeft: {
    marginRight: SIZES.base,
  },
  gridCardRight: {
    marginLeft: SIZES.base,
  },
  gridIcon: {
    marginBottom: SIZES.base,
  },
  gridCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  gridCardSub: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  actionMenu: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: SIZES.padding,
    color: COLORS.text,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: '600',
  },
});
