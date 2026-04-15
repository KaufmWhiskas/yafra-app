import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

export default function RestaurantCard({ restaurantItem }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{restaurantItem.name}</Text>
      <Text>{restaurantItem.cuisine}</Text>
      <Text>{restaurantItem.rating.toFixed(1)}</Text>
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
  },
});
