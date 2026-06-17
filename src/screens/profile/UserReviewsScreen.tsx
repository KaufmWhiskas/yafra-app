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
type JoinedReview = Review & {
  restaurant?: Restaurant;
  metadata?: { tags: string[] };
  review_text?: string;
  price_value_rating?: number;
};

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
            <View style={styles.reviewContainer}>
              <RestaurantCard
                item={restaurant}
                hideRatings={true}
                hideReviewButton={true}
              />

              <View style={styles.reviewDetails}>
                <View style={styles.reviewScores}>
                  <Text style={styles.scoreText}>
                    My Rating: {item.rating.toFixed(1)} ★
                  </Text>
                  {item.price_value_rating ? (
                    <Text style={styles.scoreText}>
                      Value: {item.price_value_rating.toFixed(1)} ★
                    </Text>
                  ) : null}
                </View>

                {item.review_text ? (
                  <Text style={styles.reviewNotes}>"{item.review_text}"</Text>
                ) : null}

                {item.metadata?.tags && item.metadata.tags.length > 0 && (
                  <View style={styles.tagsWrapper}>
                    {item.metadata.tags.map((tag: string) => (
                      <View key={tag} style={styles.tagChip}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
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
  reviewContainer: {
    marginBottom: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reviewDetails: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  reviewScores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scoreText: { fontWeight: 'bold', color: COLORS.primary, fontSize: 14 },
  reviewNotes: {
    fontStyle: 'italic',
    color: COLORS.text,
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  tagsWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: { fontSize: 12, color: COLORS.text },
});
