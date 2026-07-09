import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  useRoute,
  RouteProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchGroupRestaurants } from '../../services/groupService';
import { fetchUserBookmarkedRestaurantIds } from '../../services/bookmarkService';
import { Restaurant } from '../../types';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SIZES } from '../../constants/theme';
import RestaurantCard from '../../components/ui/RestaurantCard';
import { ActivityIndicator } from 'react-native';
import CollectionModal from '../../components/ui/CollectionModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type GroupRestaurantsScreenRouteProp = RouteProp<
  RootStackParamList,
  'GroupRestaurantsScreen'
>;

type SortOption = 'highest_rated' | 'most_reviewed' | 'alphabetical';

export default function GroupRestaurantsScreen() {
  const route = useRoute<GroupRestaurantsScreenRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { groupId } = route.params;
  const { session } = useAuth();
  const user = session?.user;

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [selectedRestaurantForBookmark, setSelectedRestaurantForBookmark] =
    useState<string | number | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('highest_rated');
  const [showSortOptions, setShowSortOptions] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [groupRestaurants, bookmarks] = await Promise.all([
        fetchGroupRestaurants(groupId),
        user?.id
          ? fetchUserBookmarkedRestaurantIds(user.id)
          : new Set<string>(),
      ]);
      setRestaurants(groupRestaurants);
      setBookmarkedIds(bookmarks);
    } catch (error) {
      console.error('Failed to load group restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const sortedRestaurants = useMemo(() => {
    const sorted = [...restaurants];
    switch (sortOption) {
      case 'highest_rated':
        sorted.sort(
          (a, b) =>
            (b.app_rating ?? b.rating ?? 0) - (a.app_rating ?? a.rating ?? 0),
        );
        break;
      case 'most_reviewed':
        sorted.sort(
          (a, b) =>
            (b.app_review_count ?? b.user_ratings_total ?? 0) -
            (a.app_review_count ?? a.user_ratings_total ?? 0),
        );
        break;
      case 'alphabetical':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }, [restaurants, sortOption]);

  const handleRestaurantPress = (restaurant: Restaurant) => {
    if (restaurant.google_place_id) {
      navigation.navigate('RestaurantDetail', {
        restaurantId: restaurant.google_place_id,
        restaurantName: restaurant.name,
      });
    }
  };

  const handleReviewPress = (restaurant: Restaurant) => {
    navigation.navigate('ReviewScreen', { restaurant });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sortFilterContainer}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <MaterialCommunityIcons name="sort" size={20} color={COLORS.text} />
          <Text style={styles.sortButtonText}>Sort by</Text>
          <MaterialCommunityIcons
            name={showSortOptions ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.text}
          />
        </TouchableOpacity>
        {showSortOptions && (
          <View style={styles.sortOptionsDropdown}>
            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSortOption('highest_rated');
                setShowSortOptions(false);
              }}
            >
              <Text style={styles.sortOptionText}>Highest Rated</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSortOption('most_reviewed');
                setShowSortOptions(false);
              }}
            >
              <Text style={styles.sortOptionText}>Most Reviewed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSortOption('alphabetical');
                setShowSortOptions(false);
              }}
            >
              <Text style={styles.sortOptionText}>Alphabetical</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={sortedRestaurants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RestaurantCard
            item={item}
            onPress={handleRestaurantPress}
            onPressReview={() => handleReviewPress(item)}
            isBookmarked={bookmarkedIds.has(item.id.toString())}
            onToggleBookmark={() => setSelectedRestaurantForBookmark(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>No restaurants found for this group.</Text>
          </View>
        }
      />
      <CollectionModal
        visible={!!selectedRestaurantForBookmark}
        restaurantId={selectedRestaurantForBookmark}
        userId={user?.id}
        onClose={() => {
          setSelectedRestaurantForBookmark(null);
          if (user?.id) {
            fetchUserBookmarkedRestaurantIds(user.id)
              .then(setBookmarkedIds)
              .catch(console.error);
          }
        }}
      />
    </View>
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
    paddingTop: 100,
  },
  listContent: {
    padding: SIZES.padding,
  },
  sortFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    zIndex: 1, // Ensure dropdown is above FlatList content
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: SIZES.radius,
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  sortOptionsDropdown: {
    position: 'absolute',
    top: 45, // Adjust based on sortButton height
    right: SIZES.padding,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sortOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  sortOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
});
