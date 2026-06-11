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
import RatingBadge from '../../components/ui/RatingBadge';
import OpeningHours from '../../components/ui/OpeningHours';
import RouteButton from '../../components/ui/RouteButton';
import { resolveRestaurantDisplay } from '../../utils/displayState';
import { COLORS } from '../../constants/theme';
import { Restaurant } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { fetchPersonalRating } from '../../services/reviewService';
import CollectionModal from '../../components/ui/CollectionModal';

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
  const [personalRating, setPersonalRating] = useState<number | undefined>();
  const [isCollectionModalVisible, setCollectionModalVisible] = useState(false);

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

  // Split these into dedicated single-responsibility tracking blocks
  useEffect(() => {
    if (user?.id) {
      fetchUserBookmarkedRestaurantIds(user.id)
        .then(setBookmarkedRestaurantIds)
        .catch(console.error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && details?.id) {
      fetchPersonalRating(user.id, details.id).then(setPersonalRating);
    }
  }, [user?.id, details?.id]); // Re-evaluates instantly when the internal ID updates

  const handleToggleBookmark = () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to save restaurants.',
      );
      return;
    }

    if (!details?.id) {
      Alert.alert(
        'Not Saved Yet',
        'This restaurant could not be saved to the database. Please try again.',
      );
      return;
    }

    setCollectionModalVisible(true);
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
            color={
              isCurrentlyBookmarked
                ? (COLORS as Record<string, string>).bookmark || COLORS.primary
                : COLORS.text
            }
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{restaurantName}</Text>
          </View>

          {details && (
            <View>
              <Text style={styles.address}>
                {details.address || 'Address not available'}
              </Text>

              <View style={styles.ratingsRow}>
                <RatingBadge
                  label="Yours"
                  value={personalRating}
                  color={
                    personalRating
                      ? resolveRestaurantDisplay({
                          app_rating: personalRating,
                        } as Restaurant).color
                      : COLORS.primary
                  }
                />
                <RatingBadge
                  label="App"
                  value={details.app_rating}
                  color={
                    details.app_rating
                      ? resolveRestaurantDisplay({
                          app_rating: details.app_rating,
                        } as Restaurant).color
                      : '#ff9800'
                  }
                />
                <RatingBadge
                  label="Google"
                  value={details.rating}
                  color="#4285F4"
                  subValueText={
                    details.user_ratings_total
                      ? `(${details.user_ratings_total})`
                      : undefined
                  }
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Opening Hours</Text>
                <OpeningHours hours={details.opening_hours} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { bottom: Math.max(insets.bottom + 16, 24) }]}
      >
        <TouchableOpacity style={styles.reviewButton} onPress={handleAddReview}>
          <Text style={styles.reviewButtonText}>Add Review</Text>
        </TouchableOpacity>
      </View>

      {details &&
        details.latitude !== undefined &&
        details.longitude !== undefined && (
          <RouteButton
            latitude={details.latitude}
            longitude={details.longitude}
            label={restaurantName}
            style={{ bottom: Math.max(insets.bottom + 16, 24) + 72 }}
          />
        )}

      {details?.id && (
        <CollectionModal
          visible={isCollectionModalVisible}
          restaurantId={details.id}
          userId={user?.id}
          onClose={() => {
            setCollectionModalVisible(false);
            if (user?.id) {
              fetchUserBookmarkedRestaurantIds(user.id)
                .then(setBookmarkedRestaurantIds)
                .catch(console.error);
            }
          }}
        />
      )}
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
    paddingBottom: 120,
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0', // Clean horizontal section separation border
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
    paddingTop: 12,
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  reviewButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
