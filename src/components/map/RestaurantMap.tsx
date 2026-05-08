import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Region, Callout } from 'react-native-maps';
import { Restaurant } from '../../types';
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

// 1. Hide default Google POIs so only our restaurants show up
const mapStyle = [
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
];

// Helper to get a generic emoji based on the cuisine string
const getEmojiForCuisine = (cuisine?: string) => {
  if (!cuisine) return '🍽️';
  const c = cuisine.toLowerCase();
  if (c.includes('pizza')) return '🍕';
  if (c.includes('burger') || c.includes('hamburger')) return '🍔';
  if (c.includes('cafe') || c.includes('coffee')) return '☕';
  if (c.includes('sushi')) return '🍣';
  return '🍽️';
};

// Helper for dynamic coloring based on rating
const getMarkerStyle = (rating?: number) => {
  let backgroundColor = '#808080'; // Gray for unrated
  if (rating && rating >= 4.0) {
    backgroundColor = '#4CAF50'; // Green for good
  } else if (rating && rating >= 3.0) {
    backgroundColor = '#FFC107'; // Yellow for okay
  }

  return [styles.customMarker, { backgroundColor }];
};

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
    <View style={styles.container}>
      <MapView
        testID={testID || 'mock-map'}
        style={styles.map}
        region={region}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={showsMyLocationButton}
        toolbarEnabled={toolbarEnabled}
        onPress={onMapPress}
        onRegionChangeComplete={onRegionChangeComplete}
        customMapStyle={mapStyle} // Apply the custom style here
      >
        {restaurants
          .filter(
            (r) =>
              typeof r.latitude === 'number' && typeof r.longitude === 'number',
          )
          .map((restaurant) => {
            const displayRating = restaurant.app_rating || restaurant.rating;

            return (
              <Marker
                key={restaurant.id}
                testID="restaurant-marker"
                coordinate={{
                  latitude: restaurant.latitude,
                  longitude: restaurant.longitude,
                }}
                onPress={() => onRestaurantSelect(restaurant)}
              >
                {/* Custom UI inside the Marker */}
                <View style={getMarkerStyle(displayRating)}>
                  <Text style={styles.markerText}>
                    {getEmojiForCuisine(restaurant.cuisine)}{' '}
                    {displayRating ? displayRating.toFixed(1) : 'New'}
                  </Text>
                </View>

                {/* Keep the callout for details if you like, or rely on the bottom sheet */}
                <Callout tooltip>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{restaurant.name}</Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
      </MapView>

      {/* Selected Restaurant Overlay Card */}
      {selectedRestaurant && (
        <View testID="floating-preview-card" style={styles.cardContainer}>
          <RestaurantCard
            item={selectedRestaurant}
            onPressReview={() => onPressReview?.(selectedRestaurant)}
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
  customMarker: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderColor: '#fff',
    borderWidth: 2,
    elevation: 4, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  markerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  calloutContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    elevation: 4,
  },
  calloutTitle: {
    fontWeight: 'bold',
  },
});
