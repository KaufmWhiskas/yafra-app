import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Restaurant } from '../../types';
import RestaurantCard from './RestaurantCard';
import { SIZES } from '../../constants/theme';

interface RestaurantListProps {
  restaurants: Restaurant[];
  bookmarkedIds: Set<string>;
  onPressReview: (restaurant: Restaurant) => void;
  onToggleBookmark: (restaurantId: string | number) => void;
}

export default function RestaurantList({
  restaurants,
  bookmarkedIds,
  onPressReview,
  onToggleBookmark,
}: RestaurantListProps) {
  return (
    <FlatList
      testID="list-view"
      contentContainerStyle={styles.listContent}
      data={restaurants}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <RestaurantCard
          item={item}
          onPressReview={() => onPressReview(item)}
          isBookmarked={bookmarkedIds.has(item.id.toString())}
          onToggleBookmark={() => onToggleBookmark(item.id)}
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
