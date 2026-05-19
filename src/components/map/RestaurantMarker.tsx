import React, { useState, useEffect, memo, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Restaurant } from '../../types';
import { COLORS } from '../../constants/theme';

const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

interface RestaurantMarkerProps {
  restaurant: Restaurant;
  isBookmarked?: boolean;
  isSelected: boolean;
  onPress: (restaurant: Restaurant) => void;
}

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

function RestaurantMarker({
  restaurant,
  isBookmarked,
  isSelected,
  onPress,
}: RestaurantMarkerProps) {
  const [trackChanges, setTrackChanges] = useState(true);

  // 🚨 MATH FIX 🚨
  // 0.75 scale of the 56px width is exactly 42px.
  // It now starts seamlessly at its unselected size and grows outward.
  const scaleAnim = useRef(new Animated.Value(isSelected ? 0.75 : 1)).current;

  // Because the `key` swaps on selection, this component mounts fresh every time state changes.
  useEffect(() => {
    if (isSelected) {
      scaleAnim.setValue(0.75); // Start at original 42px equivalent
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6, // Slightly higher friction to settle smoothly
        tension: 250, // Higher = faster pop
        overshootClamping: true, // Prevents bouncing past 1.0
        useNativeDriver: false, // MUST be false so Android Map SDK registers the redraw frames
      }).start();
    }

    setTrackChanges(true);
    // Keep awake for 800ms to guarantee the spring has completely finished resting before the camera locks.
    const timer = setTimeout(() => setTrackChanges(false), 800);
    return () => clearTimeout(timer);
  }, [isSelected, isBookmarked, scaleAnim]);

  const displayRating = restaurant.app_rating || restaurant.rating;
  const baseBgColor = getMarkerColor(restaurant.app_rating, isBookmarked);
  const iconName = getIconForCuisine(restaurant.cuisine);

  // 🚨 LARGER SELECTION SIZES 🚨
  const width = isSelected ? 56 : 42;
  const height = isSelected ? 36 : 28;
  const borderRadius = isSelected ? 18 : 14;

  return (
    <>
      {/* 1. THE VISUAL LAYER */}
      <Marker
        key={`visual-${restaurant.id}-${isSelected ? 'active' : 'idle'}-${isBookmarked ? 'saved' : 'unsaved'}`}
        coordinate={{
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
        }}
        tracksViewChanges={trackChanges}
        anchor={{ x: 0.5, y: 0.5 }}
        zIndex={isSelected ? 50 : isBookmarked ? 10 : 5}
      >
        {/* THE ANTI-CLIPPING BOUNDING BOX */}
        <View
          style={{
            width,
            height,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Animated.View
            style={[
              styles.markerInner,
              {
                width,
                height,
                borderRadius,
                backgroundColor: baseBgColor,
                borderColor: isSelected ? COLORS.primary : '#fff',
                borderWidth: isSelected ? 3 : 2,
                transform: [{ scale: scaleAnim }], // Apply the pop!
              },
            ]}
          >
            {displayRating ? (
              <Text style={styles.markerText}>{displayRating.toFixed(1)}</Text>
            ) : (
              <MaterialCommunityIcons name={iconName} size={14} color="#fff" />
            )}
          </Animated.View>
        </View>
      </Marker>

      {/* 2. THE INDESTRUCTIBLE TOUCH SHIELD */}
      <Marker
        key={`touch-${restaurant.id}`}
        coordinate={{
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
        }}
        // Feeds the empty PNG directly to the map engine
        image={{ uri: TRANSPARENT_PIXEL }}
        tracksViewChanges={false}
        anchor={{ x: 0.5, y: 0.5 }}
        zIndex={9999}
        onPress={(e) => {
          if (e && e.stopPropagation) e.stopPropagation();
          onPress(restaurant);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  markerInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  markerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default memo(RestaurantMarker, (prev, next) => {
  return (
    prev.restaurant.id === next.restaurant.id &&
    prev.isBookmarked === next.isBookmarked &&
    prev.isSelected === next.isSelected &&
    prev.restaurant.app_rating === next.restaurant.app_rating &&
    prev.restaurant.rating === next.restaurant.rating
  );
});
