import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
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

type GroupRestaurantsScreenRouteProp = RouteProp<
  RootStackParamList,
  'GroupRestaurantsScreen'
>;

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

  // NOTE: Local sort/filter state can be added here later if needed.
  // For now, we default to sorting by highest rating.

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
    return [...restaurants].sort(
      (a, b) =>
        (b.app_rating ?? b.rating ?? 0) - (a.app_rating ?? a.rating ?? 0),
    );
  }, [restaurants]);

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
});
