import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { Restaurant } from '../../types';
import RestaurantCard from '../ui/RestaurantCard';
import RestaurantMarker from './RestaurantMarker';

interface RestaurantMapProps {
  mapRef?: React.Ref<MapView>;
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
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (id: string | number) => void;
}

/** Custom map style configuration used to hide default Points of Interest (POIs). */
const mapStyle = [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }];

/**
 * Component representing the interactive map layout.
 * Renders the underlying map view engine, restaurant location markers,
 * and a conditional floating preview card upon restaurant selection.
 */
export default function RestaurantMap({
  mapRef,
  restaurants,
  selectedRestaurant,
  onRestaurantSelect,
  onMapPress,
  region,
  showsUserLocation,
  showsMyLocationButton,
  toolbarEnabled,
  testID,
  onPressReview,
  onRegionChangeComplete,
  bookmarkedIds,
  onToggleBookmark,
}: RestaurantMapProps) {
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        testID={testID || 'restaurant-map'}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={showsMyLocationButton}
        toolbarEnabled={toolbarEnabled}
        onPress={onMapPress}
        moveOnMarkerPress={false}
        onRegionChangeComplete={onRegionChangeComplete}
        customMapStyle={mapStyle}
      >
        {restaurants.map((restaurant) => {
          const isBookmarked = bookmarkedIds?.has(restaurant.id.toString());

          return (
            <RestaurantMarker
              key={`base-${restaurant.id}`}
              restaurant={restaurant}
              isBookmarked={isBookmarked}
              isSelected={false}
              onPress={onRestaurantSelect}
            />
          );
        })}

        {selectedRestaurant && (
          <RestaurantMarker
            key={`overlay-${selectedRestaurant.id}`}
            restaurant={selectedRestaurant}
            isBookmarked={bookmarkedIds?.has(selectedRestaurant.id.toString())}
            isSelected={true}
            isOverlay={true}
            onPress={onRestaurantSelect}
          />
        )}
      </MapView>

      {selectedRestaurant && (
        <View testID="floating-preview-card" style={styles.cardContainer}>
          <RestaurantCard
            item={selectedRestaurant}
            onPressReview={() => onPressReview?.(selectedRestaurant)}
            isBookmarked={bookmarkedIds?.has(selectedRestaurant.id.toString())}
            onToggleBookmark={() => onToggleBookmark?.(selectedRestaurant.id)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});
