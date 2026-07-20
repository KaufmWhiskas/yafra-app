import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types/navigation';
import {
  fetchUserReviewedRestaurants,
  deleteReview,
} from '../../services/reviewService';
import RestaurantCard from '../../components/ui/RestaurantCard';
import { COLORS, SIZES } from '../../constants/theme';
import { Restaurant, Review } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type UserReviewsRouteProp = RouteProp<RootStackParamList, 'UserReviewsScreen'>;
type JoinedReview = Omit<Review, 'id'> & {
  restaurant?: Restaurant;
  metadata?: { tags: string[] };
  review_text?: string;
  price_value_rating?: number;
  visit_date?: string | null;
  created_at?: string;
  id: number;
};

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ReviewListItem = ({
  item,
  onRemove,
  navigation,
}: {
  item: JoinedReview;
  onRemove: (id: number) => void;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) => {
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const isLongText = item.review_text && item.review_text.length > 120;

  const restaurant =
    item.restaurant ||
    ({
      id: 'unknown',
      name: 'Unknown Restaurant',
      cuisine: 'unknown',
      latitude: 0,
      longitude: 0,
    } as Restaurant);

  const displayDate = item.visit_date
    ? item.visit_date
    : item.created_at
      ? new Date(item.created_at).toISOString().split('T')[0]
      : 'Unknown Date';

  const toggleDetails = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDetailsExpanded(!isDetailsExpanded);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReview(item.id);
              onRemove(item.id);
            } catch {
              Alert.alert('Error', 'Failed to delete review.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.reviewContainer}>
      <RestaurantCard
        item={restaurant}
        hideRatings={true}
        hideReviewButton={true}
        onPress={toggleDetails}
      />

      <TouchableOpacity
        style={styles.expandIndicator}
        onPress={toggleDetails}
        activeOpacity={0.7}
      >
        <Text style={styles.expandIndicatorText}>
          {isDetailsExpanded ? 'Hide Review Details' : 'Show Review Details'}
        </Text>
        <MaterialCommunityIcons
          name={isDetailsExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.textLight}
        />
      </TouchableOpacity>

      {isDetailsExpanded && (
        <View style={styles.reviewDetails}>
          <View style={styles.reviewScoresRow}>
            <View style={styles.scoreColumn}>
              <Text style={styles.scoreText}>
                My Rating: {item.rating.toFixed(1)} ★
              </Text>
              {item.price_value_rating ? (
                <Text style={styles.scoreText}>
                  Value: {item.price_value_rating.toFixed(1)} ★
                </Text>
              ) : null}
            </View>

            <View style={styles.actionColumn}>
              <Text style={styles.dateText}>{displayDate}</Text>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ReviewScreen', {
                    restaurant: item.restaurant as Restaurant,
                    editReviewId: item.id,
                    existingReviewData: item as unknown as Record<
                      string,
                      unknown
                    >,
                  })
                }
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ marginRight: 16 }}
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDelete}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                testID={`delete-review-button-${item.id}`}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={20}
                  color={COLORS.danger}
                />
              </TouchableOpacity>
            </View>
          </View>

          {item.review_text ? (
            <View>
              <Text
                style={styles.reviewNotes}
                numberOfLines={isTextExpanded ? undefined : 3}
              >
                "{item.review_text}"
              </Text>
              {isLongText && (
                <TouchableOpacity
                  onPress={() => setIsTextExpanded(!isTextExpanded)}
                >
                  <Text style={styles.showMoreLink}>
                    {isTextExpanded ? 'Show less' : 'Show more'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
      )}
    </View>
  );
};

export default function UserReviewsScreen() {
  const route = useRoute<UserReviewsRouteProp>();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
        renderItem={({ item }) => (
          <ReviewListItem
            item={item}
            navigation={navigation}
            onRemove={(id) =>
              setReviews((prev) => prev.filter((r) => r.id !== id))
            }
          />
        )}
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
  reviewScoresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scoreColumn: {
    flexDirection: 'column',
    gap: 4,
  },
  actionColumn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: 'bold',
    marginRight: 12,
  },
  showMoreLink: {
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: -6,
  },
  reviewDetails: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
  expandIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: -8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: COLORS.surface,
  },
  expandIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    marginRight: 4,
  },
});
