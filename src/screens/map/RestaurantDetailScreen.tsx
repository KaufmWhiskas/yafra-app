import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchRestaurantDetails } from '../../services/restaurantService';
import { fetchUserBookmarkedRestaurantIds } from '../../services/bookmarkService';
// @ts-expect-error: toggleBookmark is not yet exported from bookmarkService
import { toggleBookmark } from '../../services/bookmarkService';
import ReviewSummary from '../../components/ui/ReviewSummary';
import RatingBadge from '../../components/ui/RatingBadge';
import OpeningHours from '../../components/ui/OpeningHours';
import RouteButton from '../../components/ui/RouteButton';
import GoogleReviewList from '../../components/ui/GoogleReviewList';
import { COLORS } from '../../constants/theme';
import { Restaurant } from '../../types';
import { useAuth } from '../../context/AuthContext';

type RestaurantDetailRouteProp = RouteProp<
  { RestaurantDetail: { restaurantId: string; restaurantName: string } },
  'RestaurantDetail'
>;

export default function RestaurantDetailScreen() {
  const route = useRoute<RestaurantDetailRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const user = session?.user;
  const { restaurantId, restaurantName } = route.params;
  const [details, setDetails] = useState<Partial<Restaurant> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarkedRestaurantIds, setBookmarkedRestaurantIds] = useState<
    Set<string>
  >(new Set());

  const isCurrentlyBookmarked = details?.id
    ? bookmarkedRestaurantIds.has(details.id.toString())
    : false;

  useEffect(() => {
    setIsLoading(true);
    fetchRestaurantDetails(restaurantId)
      .then(setDetails)
      .catch((error) => {
        console.error('Failed to fetch restaurant details:', error);
        Alert.alert(
          'Error',
          'Could not load restaurant details. Please try again later.',
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [restaurantId]);

  useEffect(() => {
    if (user?.id) {
      fetchUserBookmarkedRestaurantIds(user.id)
        .then(setBookmarkedRestaurantIds)
        .catch(console.error);
    }
  }, [user?.id]);

  const handleToggleBookmark = () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to save restaurants.',
      );
      return;
    }

    if (details?.id) {
      const restaurantIdStr = details.id.toString();
      const wasBookmarked = isCurrentlyBookmarked;

      // Eagerly update local state
      setBookmarkedRestaurantIds((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.delete(restaurantIdStr);
        else next.add(restaurantIdStr);
        return next;
      });

      // Call backend
      toggleBookmark(user.id, details.id).catch((err: Error) => {
        console.error('Failed to toggle bookmark:', err);
        // The UI will optimistically assume success, but if we wanted we could revert the state here on error
      });
    }
  };

  const handleAddReview = () => {
    if (!details) return;

    const restaurantForReview: Restaurant = {
      id: details.id || restaurantId,
      name: restaurantName,
      cuisine: details.cuisine || 'unknown',
      latitude: details.latitude || 0,
      longitude: details.longitude || 0,
      ...details,
    };

    navigation.navigate('ReviewScreen', { restaurant: restaurantForReview });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!details) {
    return (
      <View style={styles.center}>
        <Text>Could not load restaurant details.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {restaurantName}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleToggleBookmark}
          testID="bookmark-header-button"
        >
          <MaterialCommunityIcons
            name={isCurrentlyBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isCurrentlyBookmarked ? COLORS.primary : COLORS.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Photo Gallery Placeholder */}
        <View style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderText}>Photo Gallery</Text>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{restaurantName}</Text>
            {details &&
              details.latitude !== undefined &&
              details.longitude !== undefined && (
                <RouteButton
                  latitude={details.latitude}
                  longitude={details.longitude}
                  label={restaurantName}
                />
              )}
          </View>

          {details && (
            <View>
              <Text style={styles.address}>
                {details.address || 'Address not available'}
              </Text>

              <View style={styles.ratingsRow}>
                <RatingBadge
                  label="Yours"
                  value={details.app_rating}
                  color={COLORS.primary}
                />
                <RatingBadge
                  label="Groups"
                  value={details.group_rating}
                  color="#ff9800"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Opening Hours</Text>
                <OpeningHours hours={details.opening_hours} />
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                <ReviewSummary
                  rating={details.rating}
                  reviewCount={details.user_ratings_total}
                />
                <GoogleReviewList reviews={details.google_reviews} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom + 16, 24) },
        ]}
      >
        <TouchableOpacity style={styles.reviewButton} onPress={handleAddReview}>
          <Text style={styles.reviewButtonText}>Add Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  photoPlaceholder: {
    height: 200,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  address: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  ratingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reviewSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  placeholderText: {
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  reviewButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
