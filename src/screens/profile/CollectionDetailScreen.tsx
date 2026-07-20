import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SIZES } from '../../constants/theme';
import { RootStackParamList } from '../../types/navigation';
import {
  fetchCollectionRestaurants,
  toggleBookmarkInCollection,
} from '../../services/bookmarkService';
import { Restaurant } from '../../types';
import RestaurantList from '../../components/ui/RestaurantList';
import { useAuth } from '../../context/AuthContext';

type CollectionDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'CollectionDetailScreen'
>;

export default function CollectionDetailScreen() {
  const route = useRoute<CollectionDetailScreenRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { collectionId, collectionName } = route.params;

  const { session } = useAuth();
  const userId = session?.user?.id;

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchCollectionRestaurants(collectionId);
        setRestaurants(data);
      } catch (error) {
        console.error('Failed to fetch collection restaurants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [collectionId]);

  const bookmarkedIds = new Set(restaurants.map((r) => r.id.toString()));

  const handlePressReview = (restaurant: Restaurant) => {
    navigation.navigate('ReviewScreen', { restaurant });
  };

  const handleToggleBookmark = (restaurantId: string | number) => {
    if (!userId) return;

    const targetedRestaurant = restaurants.find(
      (r) => r.id.toString() === restaurantId.toString(),
    );
    const restaurantName = targetedRestaurant
      ? targetedRestaurant.name
      : 'this restaurant';

    Alert.alert(
      'Remove Restaurant',
      `Are you sure you want to remove ${restaurantName} from this collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedRestaurants = restaurants.filter(
              (r) => r.id.toString() !== restaurantId.toString(),
            );
            setRestaurants(updatedRestaurants);

            try {
              await toggleBookmarkInCollection(
                userId,
                restaurantId,
                collectionId,
                true,
              );
            } catch (error) {
              console.error(
                'Failed to remove bookmark from collection:',
                error,
              );
              // Revert back on database network constraint failure
              Alert.alert(
                'Error',
                'Could not remove restaurant. Try again later.',
              );
              // Trigger a full fetch to restore correct state sync bounds
              const data = await fetchCollectionRestaurants(collectionId);
              setRestaurants(data);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{collectionName}</Text>
      </View>

      {isLoading ? (
        <Text style={styles.emptyText}>Loading...</Text>
      ) : restaurants.length === 0 ? (
        <Text style={styles.emptyText}>No restaurants in this collection.</Text>
      ) : (
        <RestaurantList
          restaurants={restaurants}
          bookmarkedIds={bookmarkedIds}
          onPressReview={handlePressReview}
          onToggleBookmark={handleToggleBookmark}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emptyText: {
    padding: SIZES.padding,
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: SIZES.padding * 2,
  },
});
