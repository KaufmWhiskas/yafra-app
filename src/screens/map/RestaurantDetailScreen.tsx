import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import {
  useRoute,
  RouteProp,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
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
import { supabase } from '../../services/supabase';
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
  const [personalRating, setPersonalRating] = useState<{
    rating: number;
    count: number;
  } | null>(null);
  const [isCollectionModalVisible, setCollectionModalVisible] = useState(false);
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [userRestaurantHistory, setUserRestaurantHistory] = useState<
    Record<string, unknown>[]
  >([]);

  const isCurrentlyBookmarked = details?.id
    ? bookmarkedRestaurantIds.has(details.id.toString())
    : false;

  useFocusEffect(
    useCallback(() => {
      if (!details) setIsLoading(true);
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId]),
  );

  useEffect(() => {
    if (user?.id) {
      fetchUserBookmarkedRestaurantIds(user.id)
        .then(setBookmarkedRestaurantIds)
        .catch(console.error);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id && details?.id) {
        fetchPersonalRating(user.id, details.id).then(setPersonalRating);
      }
    }, [user?.id, details?.id]),
  );

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

  const handleAddReview = async () => {
    if (!details) return;

    const restaurantForReview: Restaurant = {
      id: details.id || restaurantId,
      name: restaurantName,
      cuisine: details.cuisine || 'unknown',
      latitude: details.latitude || 0,
      longitude: details.longitude || 0,
      ...details,
    };

    if (user?.id) {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('restaurant_id', (details.id || restaurantId).toString())
        .eq('visit_date', today)
        .maybeSingle();

      if (data) {
        Alert.alert(
          'Already Reviewed',
          'You already reviewed this restaurant today. Would you like to edit your existing review?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Edit Review',
              onPress: () => {
                navigation.navigate('ReviewScreen', {
                  restaurant: restaurantForReview,
                  editReviewId: data.id as number | string,
                  existingReviewData: data,
                });
              },
            },
          ],
        );
        return;
      }
    }

    navigation.navigate('ReviewScreen', { restaurant: restaurantForReview });
  };

  const handleViewHistory = async () => {
    if (!user?.id || !details?.id) return;

    // Fetch the raw review rows for this specific restaurant
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('restaurant_id', details.id.toString())
      .order('visit_date', { ascending: false, nullsFirst: false });

    if (data) {
      setUserRestaurantHistory(data as Record<string, unknown>[]);
      setHistoryModalVisible(true);
    }
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
                  value={personalRating?.rating}
                  color={
                    personalRating?.rating
                      ? resolveRestaurantDisplay({
                          app_rating: personalRating.rating,
                        } as Restaurant).color
                      : COLORS.primary
                  }
                  count={personalRating?.count}
                  onPress={handleViewHistory}
                  disabled={!personalRating?.count}
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
                  count={details.app_review_count}
                />
                <RatingBadge
                  label="Google"
                  value={details.rating}
                  color="#4285F4"
                  count={details.user_ratings_total}
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

      <Modal
        visible={isHistoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Review History</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={COLORS.text}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={userRestaurantHistory}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const displayDate = String(
                  item.visit_date ||
                    String(item.created_at || '').split('T')[0] ||
                    'Unknown Date',
                );
                return (
                  <View style={styles.historyCard}>
                    <View style={styles.historyCardHeader}>
                      <Text style={styles.historyDate}>{displayDate}</Text>
                      <Text style={styles.historyRating}>
                        {Number(item.rating).toFixed(1)} ★
                      </Text>
                    </View>
                    {item.review_text ? (
                      <Text style={styles.historyText}>
                        "{String(item.review_text)}"
                      </Text>
                    ) : null}
                    <TouchableOpacity
                      style={styles.editHistoryButton}
                      onPress={() => {
                        setHistoryModalVisible(false);
                        const restaurantForReview: Restaurant = {
                          id: details.id || restaurantId,
                          name: restaurantName,
                          cuisine: details.cuisine || 'unknown',
                          latitude: details.latitude || 0,
                          longitude: details.longitude || 0,
                          ...details,
                        };
                        navigation.navigate('ReviewScreen', {
                          restaurant: restaurantForReview,
                          editReviewId: item.id as number | string,
                          existingReviewData: item,
                        });
                      }}
                    >
                      <Text style={styles.editHistoryText}>Edit Review</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
              contentContainerStyle={styles.historyListContent}
            />
          </View>
        </View>
      </Modal>
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
    borderBottomColor: '#f0f0f0',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  historyListContent: {
    paddingBottom: 20,
  },
  historyCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  historyRating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  historyText: {
    fontSize: 14,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  editHistoryButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  editHistoryText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
