import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getMockRestaurants } from '../../services/supabase';
import { COLORS, SIZES } from '../../constants/theme';
import RestaurantCard from '../../components/ui/RestaurantCard';
import { Restaurant } from '../../types';
import ViewToggle from '../../components/ui/ViewToggle';
import { useLocation } from '../../hooks/useLocation';
import RestaurantMap from '../../components/map/RestaurantMap';

export default function MapScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map');
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const { hasLocationPermission } = useLocation();

  const handleReviewPress = (restaurant: Restaurant) => {
    console.log('Navigating to review for:', restaurant.name);
  };

  useEffect(() => {
    async function loadData() {
      const data = await getMockRestaurants();
      setRestaurants(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading mock data from Supabase...</Text>
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
          initialRegion={{
            latitude: 49.469805794737454,
            longitude: 8.422159691397045,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          toolbarEnabled={false}
          testID="mock-map"
          onPressReview={handleReviewPress}
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
