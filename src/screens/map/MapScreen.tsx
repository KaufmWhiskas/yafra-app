import { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import {
  fetchRestaurantDetails,
  fetchRestaurants,
  triggerIngest,
} from '../../services/restaurantService';
import { COLORS, SIZES } from '../../constants/theme';
import RestaurantCard from '../../components/ui/RestaurantCard';
import { Restaurant } from '../../types';
import ViewToggle from '../../components/ui/ViewToggle';
import { useLocation } from '../../hooks/useLocation';
import RestaurantMap from '../../components/map/RestaurantMap';
import SearchBar from '../../components/ui/SearchBar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Region } from 'react-native-maps';
import { Prediction } from '../../services/searchService';
import {
  BoundingBox,
  getRegionBBox,
  calculateDistance,
  Coordinate,
} from '../../utils/geo';

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
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const lastScannedLocation = useRef<Coordinate | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleRegionChangeComplete = async (region: Region) => {
    setMapRegion(region); // Ensure state stays in sync with user gestures

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      const currentCoord: Coordinate = {
        latitude: region.latitude,
        longitude: region.longitude,
      };

      if (lastScannedLocation.current) {
        const distance = calculateDistance(
          lastScannedLocation.current,
          currentCoord,
        );
        if (distance < 0.5) return; // 0.5 km = 500 meters
      }

      lastScannedLocation.current = currentCoord;
      const bbox = getRegionBBox(region);

      try {
        await triggerIngest(bbox);
        await loadData(bbox);
      } catch (error) {
        console.error('Failed to ingest or refresh restaurants:', error);
      }
    }, 800);
  };

  useEffect(() => {
    loadData(getRegionBBox(mapRegion)).finally(() => setIsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        />
      ) : (
        <FlatList
          testID="list-view"
          contentContainerStyle={styles.listContent}
          data={restaurants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <RestaurantCard
              item={item}
              onPressReview={() => handleReviewPress(item)}
            />
          )}
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
  listContent: {
    paddingTop: SIZES.padding, // Reduced since the header is no longer absolutely positioned over the list
    paddingHorizontal: SIZES.padding,
  },
});
