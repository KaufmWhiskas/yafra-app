import React, { useState, useEffect, memo, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Restaurant } from '../../types';
import { COLORS } from '../../constants/theme';
import { resolveRestaurantDisplay } from '../../utils/displayState';
import { useIsFocused } from '@react-navigation/native';

/**
 * Base64 string representing a 1x1 transparent PNG pixel.
 * Used as an invisible touch target over the map markers.
 */
const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

interface RestaurantMarkerProps {
  restaurant: Restaurant;
  isBookmarked?: boolean;
  isSelected: boolean;
  isOverlay?: boolean;
  onPress: (restaurant: Restaurant) => void;
}

/**
 * Maps a given cuisine type to a corresponding MaterialCommunityIcons icon name.
 * Defaults to a generic silverware icon if no match is found.
 */
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

/**
 * Component representing an individual restaurant marker on the map view.
 * Renders a visual indicator layer and an invisible interactive touch shield.
 */
function RestaurantMarker({
  restaurant,
  isBookmarked,
  isSelected,
  isOverlay,
  onPress,
}: RestaurantMarkerProps) {
  const [trackChanges, setTrackChanges] = useState(true);
  const isFocused = useIsFocused();

  const scaleAnim = useRef(new Animated.Value(isSelected ? 0.75 : 1)).current;

  useEffect(() => {
    if (isSelected) {
      scaleAnim.setValue(0.75);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 250,
        overshootClamping: true,
        useNativeDriver: false, // Required false for layout frame rendering in Android Map SDK.
      }).start();
    }

    setTrackChanges(true);
    const timer = setTimeout(() => setTrackChanges(false), 800);
    return () => clearTimeout(timer);
  }, [isSelected, isBookmarked, scaleAnim]);

  useEffect(() => {
    if (isFocused) {
      setTrackChanges(true);
      const timer = setTimeout(() => setTrackChanges(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  const displayState = resolveRestaurantDisplay(restaurant, isBookmarked);
  const bgColor = displayState.isHollow ? '#ffffff' : displayState.color;
  const borderColor = isSelected
    ? COLORS.primary
    : displayState.isHollow
      ? displayState.color
      : '#fff';
  const textColor = displayState.isHollow ? displayState.color : '#fff';

  const iconName = getIconForCuisine(restaurant.cuisine);

  const width = isSelected ? 56 : 42;
  const height = isSelected ? 36 : 28;
  const borderRadius = isSelected ? 18 : 14;

  return (
    <>
      <Marker
        key={`visual-${restaurant.id}-${isSelected ? 'active' : 'idle'}-${isBookmarked ? 'saved' : 'unsaved'}`}
        coordinate={{
          latitude: restaurant.latitude + (isOverlay ? 0.0000001 : 0),
          longitude: restaurant.longitude,
        }}
        tracksViewChanges={trackChanges}
        anchor={{ x: 0.5, y: 0.5 }}
        zIndex={isSelected ? 50 : isBookmarked ? 10 : 5}
      >
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
                backgroundColor: bgColor,
                borderColor,
                borderWidth: isSelected ? 3 : 2,
                transform: [{ scale: scaleAnim }],
              },
            ]}
            testID="marker-inner"
          >
            {displayState.display === 'bookmark-icon' ? (
              <MaterialCommunityIcons
                name="bookmark"
                size={14}
                color={textColor}
              />
            ) : displayState.display === 'unrated-icon' ? (
              <MaterialCommunityIcons
                name={iconName}
                size={14}
                color={textColor}
              />
            ) : (
              <Text style={[styles.markerText, { color: textColor }]}>
                {displayState.display}
              </Text>
            )}
          </Animated.View>
        </View>
      </Marker>

      <Marker
        key={`touch-${restaurant.id}`}
        coordinate={{
          latitude: restaurant.latitude + (isOverlay ? 0.0000001 : 0),
          longitude: restaurant.longitude,
        }}
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
    prev.isOverlay === next.isOverlay &&
    prev.restaurant.app_rating === next.restaurant.app_rating &&
    prev.restaurant.rating === next.restaurant.rating
  );
});
