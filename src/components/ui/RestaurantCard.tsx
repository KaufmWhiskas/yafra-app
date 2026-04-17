import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';
import { Restaurant } from '../../types';

interface RestaurantCardProps {
  item: Restaurant;
  /** Triggered when the user initiates the review flow */
  onPressReview?: () => void;
}

/**
 * Displays summarized restaurant information.
 */
export default function RestaurantCard({
  item,
  onPressReview,
}: RestaurantCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{item.name}</Text>
      <Text>{item.cuisine}</Text>
      <Text>{item.rating ? item.rating.toFixed(1) : 'No Rating'}</Text>

      <TouchableOpacity
        style={styles.reviewButton}
        onPress={onPressReview}
        testID="add-review-button"
      >
        <Text style={styles.reviewButtonText}>Add Review</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reviewButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
