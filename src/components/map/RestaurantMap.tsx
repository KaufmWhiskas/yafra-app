import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { Restaurant } from '../../types';
import RestaurantCard from '../ui/RestaurantCard';
import RestaurantMarker from './RestaurantMarker';
import {
  getVisibleRestaurants,
  sortRestaurantsByDistance,
} from '../../utils/geo';
import { useStaggeredList } from '../../hooks/useStaggeredList';

interface RestaurantMapProps {
  mapRef?: React.Ref<MapView>;
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
  onMapPress: () => void;
  region: Region;
  settledRegion?: Region;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  toolbarEnabled?: boolean;
  testID?: string;
  onPressReview?: (restaurant: Restaurant) => void;
  onRegionChangeComplete?: (region: Region) => void;
  onRegionChange?: () => void;
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
  settledRegion,
  showsUserLocation,
  showsMyLocationButton,
  showsCompass,
  toolbarEnabled,
  testID,
  onPressReview,
  onRegionChangeComplete,
  onRegionChange,
  bookmarkedIds,
  onToggleBookmark,
}: RestaurantMapProps) {
  const filteringRegion = settledRegion || region;

  const visibleRestaurants = useMemo(() => {
    const rawVisible = getVisibleRestaurants(
      restaurants,
      filteringRegion,
      50,
      bookmarkedIds,
    );
    const center = {
      latitude: filteringRegion.latitude,
      longitude: filteringRegion.longitude,
    };
    return sortRestaurantsByDistance(rawVisible, center);
  }, [restaurants, filteringRegion, bookmarkedIds]);

  const staggeredRestaurants = useStaggeredList(visibleRestaurants, 5);

  // Freeze the DOM array order so the Native Engine stops destroying views on pan
  const stableDOMRestaurants = [...staggeredRestaurants].sort((a, b) =>
    a.id.toString().localeCompare(b.id.toString()),
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        testID={testID || 'restaurant-map'}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={showsMyLocationButton}
        showsCompass={showsCompass}
        toolbarEnabled={toolbarEnabled}
        onPress={onMapPress}
        moveOnMarkerPress={false}
        onRegionChangeComplete={onRegionChangeComplete}
        onRegionChange={onRegionChange}
        customMapStyle={mapStyle}
      >
        {stableDOMRestaurants.map((restaurant) => {
          const isBookmarked = bookmarkedIds?.has(restaurant.id.toString());

          return (
            <RestaurantMarker
              key={restaurant.id.toString()}
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
