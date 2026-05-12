import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Restaurant } from '../../types';
import RestaurantCard from '../ui/RestaurantCard';
import { COLORS } from '../../constants/theme';

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
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (id: string | number) => void;
}

const ZOOM_THRESHOLD = 0.02;

const mapStyle = [
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
];

const getIconForCuisine = (
  cuisine?: string,
): keyof typeof MaterialCommunityIcons.glyphMap => {
  if (!cuisine) return 'silverware-fork-knife';
  const c = cuisine.toLowerCase();
  if (c.includes('pizza')) return 'pizza';
  if (c.includes('burger') || c.includes('hamburger')) return 'hamburger';
  if (c.includes('cafe') || c.includes('coffee')) return 'coffee';
  if (c.includes('sushi')) return 'food-variant';
  return 'silverware-fork-knife';
};

const getMarkerColor = (appRating?: number, isBookmarked?: boolean) => {
  if (isBookmarked) return COLORS.bookmark;
  if (!appRating) return '#808080';
  if (appRating >= 4.0) return '#4CAF50';
  if (appRating >= 3.0) return '#FFC107';
  return '#808080';
};

interface CustomMapMarkerProps {
  restaurant: Restaurant;
  isBookmarked?: boolean;
  isZoomedIn: boolean;
  isSelected: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPress: (e: any) => void;
}

const CustomMapMarker = ({
  restaurant,
  isBookmarked,
  isZoomedIn,
  isSelected,
  onPress,
}: CustomMapMarkerProps) => {
  const [trackChanges, setTrackChanges] = useState(true);

  useEffect(() => {
    setTrackChanges(true);
    // Give the native map a full 1000ms to register the layout before turning off tracking
    const timer = setTimeout(() => setTrackChanges(false), 1000);
    return () => clearTimeout(timer);
  }, [isBookmarked, isZoomedIn, isSelected]);

  const displayRating = restaurant.app_rating || restaurant.rating;
  const bgColor = getMarkerColor(restaurant.app_rating, isBookmarked);
  const iconName = getIconForCuisine(restaurant.cuisine);
  const zIndex = isSelected
    ? 100
    : isBookmarked || restaurant.app_rating
      ? 10
      : displayRating
        ? 5
        : 1;

  return (
    <Marker
      testID="restaurant-marker"
      coordinate={{
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      }}
      tracksViewChanges={trackChanges}
      onPress={onPress}
      style={{ zIndex }}
    >
      {/* CRITICAL FIX: The dynamic 'key' forces React to completely destroy and 
        recreate this inner View when status changes. This FORCES the native Map SDK 
        to discard its stale cache and take a fresh snapshot of the new color.
      */}
      <View key={`inner-marker-${isBookmarked}-${isSelected}-${isZoomedIn}`}>
        {isZoomedIn ? (
          <View
            testID="marker-inner-view"
            style={[styles.detailedMarker, { backgroundColor: bgColor }]}
          >
            <MaterialCommunityIcons
              name={iconName}
              size={14}
              color="#fff"
              style={styles.iconSpacing}
            />
            <Text style={styles.markerText}>
              {displayRating ? displayRating.toFixed(1) : '-'}
            </Text>
          </View>
        ) : (
          <View
            testID="marker-inner-view"
            style={[styles.compactMarker, { backgroundColor: bgColor }]}
          >
            {displayRating ? (
              <Text style={styles.markerText}>{Math.round(displayRating)}</Text>
            ) : (
              <MaterialCommunityIcons name={iconName} size={12} color="#fff" />
            )}
          </View>
        )}
      </View>
    </Marker>
  );
};

export default function RestaurantMap({
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
  const isZoomedIn = region.latitudeDelta < ZOOM_THRESHOLD;

  return (
    <View style={styles.container}>
      <MapView
        testID={testID || 'restaurant-map'}
        style={styles.map}
        region={region}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={showsMyLocationButton}
        toolbarEnabled={toolbarEnabled}
        onPress={onMapPress}
        onRegionChangeComplete={onRegionChangeComplete}
        customMapStyle={mapStyle}
      >
        {restaurants.map((restaurant) => {
          const isBookmarked = bookmarkedIds?.has(restaurant.id.toString());
          const isSelected = selectedRestaurant?.id === restaurant.id;

          return (
            <CustomMapMarker
              key={restaurant.id.toString()}
              restaurant={restaurant}
              isBookmarked={isBookmarked}
              isZoomedIn={isZoomedIn}
              isSelected={isSelected}
              onPress={(e) => {
                e?.stopPropagation?.();
                onRestaurantSelect(restaurant);
              }}
            />
          );
        })}
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
  detailedMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderColor: '#fff',
    borderWidth: 2,
  },
  compactMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#fff',
    borderWidth: 2,
  },
  markerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  iconSpacing: {
    marginRight: 4,
  },
});
