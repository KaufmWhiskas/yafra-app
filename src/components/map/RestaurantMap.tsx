import React from 'react';
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

// STRICTLY color by App Rating only
const getMarkerColor = (appRating?: number, isBookmarked?: boolean) => {
  if (isBookmarked) return COLORS.bookmark;
  if (!appRating) return '#808080';
  if (appRating >= 4.0) return '#4CAF50';
  if (appRating >= 3.0) return '#FFC107';
  return '#808080';
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
          const displayRating = restaurant.app_rating || restaurant.rating;
          const bgColor = getMarkerColor(restaurant.app_rating, isBookmarked);
          const iconName = getIconForCuisine(restaurant.cuisine);
          const isSelected = selectedRestaurant?.id === restaurant.id;

          // Elevate selected > app rated > google rated > unrated
          const zIndex = isSelected
            ? 100
            : isBookmarked || restaurant.app_rating
              ? 10
              : displayRating
                ? 5
                : 1;

          return (
            <Marker
              // The key forces the native view to redraw when crossing the zoom threshold OR toggling a bookmark
              key={`${restaurant.id}-${isZoomedIn ? 'detailed' : 'compact'}-${isBookmarked ? 'bookmarked' : 'unbookmarked'}`}
              testID="restaurant-marker"
              coordinate={{
                latitude: restaurant.latitude,
                longitude: restaurant.longitude,
              }}
              onPress={(e) => {
                e?.stopPropagation?.();
                onRestaurantSelect(restaurant);
              }}
              style={{ zIndex }}
            >
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
                    <Text style={styles.markerText}>
                      {Math.round(displayRating)}
                    </Text>
                  ) : (
                    <MaterialCommunityIcons
                      name={iconName}
                      size={12}
                      color="#fff"
                    />
                  )}
                </View>
              )}
            </Marker>
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  compactMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#fff',
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
