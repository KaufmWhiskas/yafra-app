import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Restaurant } from '../../types';
import { SIZES } from '../../constants/theme';
import RestaurantCard from '../ui/RestaurantCard';

interface RestaurantMapProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
  onMapPress: () => void;
  region: Region;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  toolbarEnabled?: boolean;
  testID?: string;
  onPressReview?: (restaurant: Restaurant) => void;
  onRegionChangeComplete?: (region: Region) => void;
}

export default function RestaurantMap({
  restaurants,
  selectedRestaurant,
  onRestaurantSelect,
  onMapPress,
  region,
  showsUserLocation = true,
  showsMyLocationButton = true,
  toolbarEnabled = false,
  testID = 'restaurant-map',
  onPressReview,
  onRegionChangeComplete,
}: RestaurantMapProps) {
  return (
    <>
      <MapView
        testID={testID}
        style={styles.map}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={showsMyLocationButton}
        toolbarEnabled={toolbarEnabled}
        region={region}
        onPress={onMapPress}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {restaurants
          .filter(
            (r) =>
              typeof r.latitude === 'number' && typeof r.longitude === 'number',
          )
          .map((restaurant) => (
            <Marker
              key={restaurant.id}
              testID="restaurant-marker"
              coordinate={{
                latitude: restaurant.latitude,
                longitude: restaurant.longitude,
              }}
              onPress={(e) => {
                e?.stopPropagation?.();
                onRestaurantSelect(restaurant);
              }}
            />
          ))}
      </MapView>

      {selectedRestaurant && (
        <View testID="floating-preview-card" style={styles.floatingCard}>
          <RestaurantCard
            item={selectedRestaurant}
            onPressReview={
              onPressReview
                ? () => onPressReview(selectedRestaurant)
                : undefined
            }
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  floatingCard: {
    position: 'absolute',
    bottom: 20,
    left: SIZES.padding,
    right: SIZES.padding,
    zIndex: 10,
    elevation: 10,
  },
});
