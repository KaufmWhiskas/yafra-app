import React from 'react';
import { FlatList, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Restaurant } from '../../types';
import RestaurantCard from './RestaurantCard';
import { SIZES } from '../../constants/theme';
import { calculateDistance, Coordinate } from '../../utils/geo';

interface RestaurantListProps {
  restaurants: Restaurant[];
  bookmarkedIds: Set<string>;
  onPressItem?: (restaurant: Restaurant) => void;
  onPressReview: (restaurant: Restaurant) => void;
  onToggleBookmark: (restaurantId: string | number) => void;
  userLocation?: Coordinate;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export default function RestaurantList({
  restaurants,
  bookmarkedIds,
  onPressItem,
  onPressReview,
  onToggleBookmark,
  userLocation,
  contentContainerStyle,
}: RestaurantListProps) {
  return (
    <FlatList
      testID="list-view"
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      data={restaurants}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => {
        const distance = userLocation
          ? calculateDistance(userLocation, {
              latitude: item.latitude,
              longitude: item.longitude,
            })
          : undefined;

        return (
          <RestaurantCard
            onPress={onPressItem ? () => onPressItem(item) : undefined}
            item={item}
            onPressReview={() => onPressReview(item)}
            isBookmarked={bookmarkedIds.has(item.id.toString())}
            onToggleBookmark={() => onToggleBookmark(item.id)}
            distance={distance}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: SIZES.padding,
    paddingHorizontal: SIZES.padding,
  },
});
