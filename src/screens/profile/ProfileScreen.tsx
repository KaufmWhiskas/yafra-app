import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { fetchUserStats } from '../../services/profileService';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  // @ts-expect-error: signOut is dynamically injected or available on context
  const { session, signOut } = useAuth();
  const user = session?.user;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ reviewCount: 0, bookmarkCount: 0 });

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
      if (signOut) {
        await signOut();
      }
    } catch (error) {
      Alert.alert(
        'Logout Failed',
        error instanceof Error ? error.message : 'An error occurred',
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <MaterialCommunityIcons
            name="account"
            size={40}
            color={COLORS.textLight}
          />
        </View>
        <Text style={styles.username}>{user?.email || 'User'}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {isLoading ? '-' : stats.reviewCount}
          </Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {isLoading ? '-' : stats.bookmarkCount}
          </Text>
          <Text style={styles.statLabel}>Bookmarks</Text>
        </View>
      </View>

      <View style={styles.actionMenu}>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => navigation.navigate('WantToVisitScreen')}
        >
          <MaterialCommunityIcons
            name="bookmark-outline"
            size={24}
            color={COLORS.text}
          />
          <Text style={styles.actionText}>Want to Visit</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SIZES.padding * 2,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: SIZES.padding * 4,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SIZES.padding,
    backgroundColor: COLORS.surface,
    marginBottom: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  actionMenu: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
