import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types/navigation';
import { fetchUserReviewedRestaurants } from '../../services/reviewService';
import RestaurantCard from '../../components/ui/RestaurantCard';
import { COLORS, SIZES } from '../../constants/theme';
import { Restaurant, Review } from '../../types';

type UserReviewsRouteProp = RouteProp<RootStackParamList, 'UserReviewsScreen'>;
type JoinedReview = Review & { restaurant?: Restaurant };

export default function UserReviewsScreen() {
  const route = useRoute<UserReviewsRouteProp>();
  const insets = useSafeAreaInsets();
  const { userId } = route.params;

  const [reviews, setReviews] = useState<JoinedReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserReviewedRestaurants(userId)
      .then((data) => setReviews(data as unknown as JoinedReview[]))
      .catch((error) => console.error('Failed to fetch user reviews:', error))
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const restaurant =
            item.restaurant ||
            ({
              id: 'unknown',
              name: 'Unknown Restaurant',
              cuisine: 'unknown',
              latitude: 0,
              longitude: 0,
            } as Restaurant);
          return (
            <View style={styles.reviewCard}>
              <RestaurantCard item={restaurant} />
              <View style={styles.reviewBadge}>
                <Text style={styles.reviewBadgeText}>
                  Rated: {item.rating.toFixed(1)} ★
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: SIZES.padding },
  reviewCard: { marginBottom: 16 },
  reviewBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    elevation: 3,
  },
  reviewBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
