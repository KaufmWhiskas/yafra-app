import React from 'react';
import { FlatList, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Restaurant } from '../../types';
import RestaurantCard from './RestaurantCard';
import { SIZES } from '../../constants/theme';

interface RestaurantListProps {
  restaurants: Restaurant[];
  bookmarkedIds: Set<string>;
  onPressItem?: (restaurant: Restaurant) => void;
  onPressReview: (restaurant: Restaurant) => void;
  onToggleBookmark: (restaurantId: string | number) => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export default function RestaurantList({
  restaurants,
  bookmarkedIds,
  onPressItem,
  onPressReview,
  onToggleBookmark,
  contentContainerStyle,
}: RestaurantListProps) {
  return (
    <FlatList
      testID="list-view"
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      data={restaurants}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <RestaurantCard
          onPress={onPressItem}
          item={item}
          onPressReview={() => onPressReview(item)}
          isBookmarked={bookmarkedIds.has(item.id.toString())}
          onToggleBookmark={() => onToggleBookmark(item.id)}
          distance={(item as Restaurant & { distance?: number }).distance}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: SIZES.padding,
    paddingHorizontal: SIZES.padding,
  },
});
