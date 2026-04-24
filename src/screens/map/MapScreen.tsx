import { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import {
  fetchRestaurants,
  triggerIngest,
} from '../../services/restaurantService';
import { COLORS, SIZES } from '../../constants/theme';
import RestaurantCard from '../../components/ui/RestaurantCard';
import { Restaurant } from '../../types';
import ViewToggle from '../../components/ui/ViewToggle';
import { useLocation } from '../../hooks/useLocation';
import RestaurantMap from '../../components/map/RestaurantMap';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Region } from 'react-native-maps';
import {
  BoundingBox,
  getRegionBBox,
  calculateDistance,
  Coordinate,
} from '../../utils/geo';

/**
 * Displays a map and list view of restaurants fetched from the database.
 * Allows users to toggle between map and list views, select restaurants, and navigate to reviews.
 */
export default function MapScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map');
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  // eslint-disable-next-line
  const { hasLocationPermission } = useLocation(); // will use this soon:tm:
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const lastScannedLocation = useRef<Coordinate | null>(null);

  const handleReviewPress = (restaurant: Restaurant) => {
    navigation.navigate('ReviewScreen', { restaurant });
  };

  const initialRegion: Region = {
    latitude: 49.469805794737454,
    longitude: 8.422159691397045,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const loadData = async (bbox?: BoundingBox) => {
    try {
      if (!bbox) return;
      const data = await fetchRestaurants(bbox);

      // --- TO REMOVE SOON:tm: - Debugging logs for invisible markers ---
      console.log('Fetched count:', data?.length);
      console.log('Sample item:', data?.[0]);
      // -----------------------------------------------------------------

      setRestaurants(data || []);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
      setRestaurants([]);
    }
  };

  const handleRegionChangeComplete = async (region: Region) => {
    const currentCoord: Coordinate = {
      latitude: region.latitude,
      longitude: region.longitude,
    };

    if (lastScannedLocation.current) {
      const distance = calculateDistance(
        lastScannedLocation.current,
        currentCoord,
      );
      if (distance < 0.5) return;
    }

    lastScannedLocation.current = currentCoord;

    const bbox = getRegionBBox(region);

    try {
      // Trigger the ingest and then refresh the data
      await triggerIngest(bbox);
      await loadData(bbox);
    } catch (error) {
      // Silently fail for now, but could add user-facing feedback
      console.error('Failed to ingest or refresh restaurants:', error);
    }
  };

  useEffect(() => {
    loadData(getRegionBBox(initialRegion)).finally(() => setIsLoading(false));
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
      <ViewToggle viewMode={viewMode} onToggle={setViewMode} />

      {viewMode === 'map' ? (
        <RestaurantMap
          restaurants={restaurants}
          selectedRestaurant={selectedRestaurant}
          onRestaurantSelect={setSelectedRestaurant}
          onMapPress={() => setSelectedRestaurant(null)}
          initialRegion={initialRegion}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: 120,
    paddingHorizontal: SIZES.padding,
  },
  listItem: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    marginBottom: SIZES.base,
    borderRadius: SIZES.radius,
  },
  listTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.text,
  },
});
