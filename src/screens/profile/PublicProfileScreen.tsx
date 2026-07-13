import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { fetchUserStats } from '../../services/profileService';
import { fetchUserPublicReviews } from '../../services/reviewService';
import { Avatar } from '../../components/Avatar';
import { COLORS, SIZES } from '../../constants/theme';
import { GroupFeedReview, Review, Restaurant } from '../../types';
import FeedCard from '../../components/groups/FeedCard';

type PublicProfileScreenRouteProp = RouteProp<
  RootStackParamList,
  'PublicProfileScreen'
>;

type UserStats = {
  username: string;
  avatar_url: string | null;
  reviewCount: number;
  uniqueRestaurantsVisited: number;
  bookmarkCount: number;
};

type ReviewWithRestaurant = Review & { restaurant?: Restaurant };

export default function PublicProfileScreen() {
  const route = useRoute<PublicProfileScreenRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId } = route.params;

  const [stats, setStats] = useState<UserStats | null>(null);
  const [reviews, setReviews] = useState<GroupFeedReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        const [userStats, userReviews] = await Promise.all([
          fetchUserStats(userId),
          fetchUserPublicReviews(userId),
        ]);

        setStats(userStats);

        // Inject the known profile metadata into each review row
        const mappedReviews = (
          userReviews as unknown as ReviewWithRestaurant[]
        ).map((review) => ({
          ...review,
          profiles: {
            username: userStats.username,
            avatar_url: userStats.avatar_url,
          },
        }));

        setReviews(mappedReviews as GroupFeedReview[]);
        navigation.setOptions({ title: userStats.username || 'Profile' });
      } catch (e) {
        setError('Failed to load profile data.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [userId, navigation]);

  const renderHeader = () => {
    if (!stats) return null;

    return (
      <View style={styles.headerContainer}>
        <Avatar url={stats.avatar_url} size={80} name={stats.username} />
        <Text style={styles.username}>{stats.username}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.reviewCount}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {stats.uniqueRestaurantsVisited}
            </Text>
            <Text style={styles.statLabel}>Visited</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.bookmarkCount}</Text>
            <Text style={styles.statLabel}>Bookmarks</Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Public Reviews</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={reviews}
      renderItem={({ item }) => (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (item.restaurant?.google_place_id) {
              navigation.navigate('RestaurantDetail', {
                restaurantId: item.restaurant.google_place_id,
                restaurantName: item.restaurant.name || 'Restaurant',
              });
            }
          }}
        >
          <FeedCard review={item} />
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>This user has no public reviews.</Text>
        </View>
      }
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  headerContainer: {
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: SIZES.base,
    color: COLORS.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: SIZES.padding,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.padding * 2,
    alignSelf: 'flex-start',
  },
  listContent: {
    paddingBottom: SIZES.padding,
  },
  errorText: {
    color: COLORS.danger,
  },
  emptyText: {
    color: COLORS.textLight,
  },
});
