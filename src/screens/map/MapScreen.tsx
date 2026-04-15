import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { getMockRestaurants } from '../../services/supabase';
import { COLORS, SIZES } from '../../constants/theme';
import RestaurantCard from '../../components/ui/RestaurantCard';
import { Restaurant } from '../../types';
import * as Location from 'expo-location';
import ViewToggle from '../../components/ui/ViewToggle';

export default function MapScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map');
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await getMockRestaurants();
      setRestaurants(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    async function requestLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        setHasLocationPermission(true);
      }
    }

    requestLocation();
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
      {/* CONDITIONAL RENDERING BASED ON STATE */}
      {viewMode === 'map' ? (
        <MapView
          testID="mock-map"
          style={styles.map}
          showsUserLocation={true}
          showsMyLocationButton={true}
          toolbarEnabled={false}
          initialRegion={{
            latitude: 49.469805794737454, // Placeholder coordinates
            longitude: 8.422159691397045,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {/* Loop through the restaurants array and create a Marker for each one */}
          {restaurants
            .filter(
              (r) =>
                typeof r.latitude === 'number' &&
                typeof r.longitude === 'number',
            )
            .map((restaurant) => (
              <Marker
                key={restaurant.id}
                testID="restaurant-marker"
                coordinate={{
                  latitude: restaurant.latitude,
                  longitude: restaurant.longitude,
                }}
                title={restaurant.name}
                description={restaurant.cuisine}
              />
            ))}
        </MapView>
      ) : (
        <FlatList
          testID="list-view"
          contentContainerStyle={styles.listContent}
          data={restaurants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <RestaurantCard item={item} />}
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
  map: {
    flex: 1,
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
