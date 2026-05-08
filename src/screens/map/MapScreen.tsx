import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  fetchRestaurantDetails,
  fetchRestaurants,
} from '../../services/restaurantService';
import { COLORS } from '../../constants/theme';
import { Restaurant } from '../../types';
import ViewToggle from '../../components/ui/ViewToggle';
import { useLocation } from '../../hooks/useLocation';
import RestaurantMap from '../../components/map/RestaurantMap';
import SearchBar from '../../components/ui/SearchBar';
import RestaurantList from '../../components/ui/RestaurantList';
import { useMapScanner } from '../../hooks/useMapScanner';
import { useAuth } from '../../context/AuthContext';
import { getBookmarks, toggleBookmark } from '../../services/bookmarkService';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Region } from 'react-native-maps';
import { Prediction } from '../../services/searchService';
import { BoundingBox, getRegionBBox } from '../../utils/geo';

export default function MapScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map');
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);

  // New state to control map position
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 49.469805794737454,
    longitude: 8.422159691397045,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // disables useless eslint error
  // eslint-disable-next-line
  const { hasLocationPermission } = useLocation();

  // Cleanly extract the user from the auth session
  const { session } = useAuth();
  const user = session?.user;

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleReviewPress = (restaurant: Restaurant) => {
    navigation.navigate('ReviewScreen', { restaurant });
  };

  const handleRestaurantSelect = async (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);

    // Quietly fetch Google details in the background
    if (restaurant.google_place_id && !restaurant.rating) {
      try {
        const details = await fetchRestaurantDetails(
          restaurant.google_place_id,
        );
        setSelectedRestaurant((prev) =>
          prev?.id === restaurant.id ? { ...prev, ...details } : prev,
        );
      } catch (error) {
        console.error('Failed to fetch Google details:', error);
      }
    }
  };

  // New handler for search selection
  const handleSearchSelect = async (place: Prediction) => {
    try {
      const details = await fetchRestaurantDetails(place.placeId);
      if (details.location) {
        setMapRegion({
          latitude: details.location.latitude,
          longitude: details.location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        setSelectedRestaurant(details as Restaurant);
      }
    } catch (error) {
      console.error('Failed to fetch place details from search:', error);
    }
  };

  const loadData = async (bbox?: BoundingBox) => {
    try {
      if (!bbox) return;
      const data = await fetchRestaurants(bbox);

      setRestaurants((prev) => {
        // Create a Map to merge and deduplicate by ID
        const merged = new Map(prev.map((r) => [r.id, r]));
        // Add the new restaurants (overwriting any stale duplicates)
        data?.forEach((r) => merged.set(r.id, r));

        return Array.from(merged.values());
      });
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    }
  };

  const { scanRegion } = useMapScanner(loadData);

  const handleRegionChangeComplete = async (region: Region) => {
    setMapRegion(region); // Ensure state stays in sync with user gestures
    scanRegion(region);
  };

  useEffect(() => {
    loadData(getRegionBBox(mapRegion)).finally(() => setIsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.id) {
      getBookmarks(user.id)
        .then((bookmarks) => {
          setBookmarkedIds(new Set(bookmarks.map((b) => b.id.toString())));
        })
        .catch((error) => console.error('Failed to load bookmarks:', error));
    }
  }, [user?.id]);

  const handleToggleBookmark = async (restaurantId: string | number) => {
    if (!user?.id) return;
    const idStr = restaurantId.toString();

    // Optimistic UI update
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idStr)) next.delete(idStr);
      else next.add(idStr);
      return next;
    });

    try {
      await toggleBookmark(restaurantId, user.id);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      // If the backend call fails, the next fetch/mount will naturally correct the state
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading restaurants from database...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.floatingHeader} pointerEvents="box-none">
        <SearchBar
          onPlaceSelect={handleSearchSelect}
          userLocation={{
            latitude: mapRegion.latitude,
            longitude: mapRegion.longitude,
          }}
        />
        <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
      </View>

      {viewMode === 'map' ? (
        <RestaurantMap
          restaurants={restaurants}
          selectedRestaurant={selectedRestaurant}
          onRestaurantSelect={handleRestaurantSelect}
          onMapPress={() => setSelectedRestaurant(null)}
          region={mapRegion} // Use controlled region
          showsUserLocation={true}
          showsMyLocationButton={true}
          toolbarEnabled={false}
          testID="mock-map"
          onPressReview={handleReviewPress}
          onRegionChangeComplete={handleRegionChangeComplete}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={handleToggleBookmark}
        />
      ) : (
        <RestaurantList
          restaurants={restaurants}
          bookmarkedIds={bookmarkedIds}
          onPressReview={handleReviewPress}
          onToggleBookmark={handleToggleBookmark}
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
  floatingHeader: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 100, // Ensure search dropdown overlays the map
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
