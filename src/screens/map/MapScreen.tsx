import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { getMockRestaurants } from '../../services/supabase';
import { COLORS, SIZES } from '../../constants/theme';
import RestaurantCard from '../../components/ui/RestaurantCard';
import { Restaurant } from '../../types';
import * as Location from 'expo-location';

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
      {/* MAP / LIST TOGGLE UI */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'map' && styles.activeBtn]}
          onPress={() => setViewMode('map')}
        >
          <Text
            style={[styles.toggleText, viewMode === 'map' && styles.activeText]}
          >
            Map View
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'list' && styles.activeBtn]}
          onPress={() => setViewMode('list')}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === 'list' && styles.activeText,
            ]}
          >
            List View
          </Text>
        </TouchableOpacity>
      </View>

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
  toggleContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.largeRadius,
    padding: 4,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: SIZES.largeRadius,
  },
  activeBtn: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  activeText: {
    color: COLORS.surface,
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
