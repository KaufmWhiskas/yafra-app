import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';
import { Restaurant } from '../../types';

interface RestaurantCardProps {
  item: Restaurant;
}

export default function RestaurantCard({ item }: RestaurantCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{item.name}</Text>
      <Text>{item.cuisine}</Text>
      <Text>{item.rating ? item.rating.toFixed(1) : 'No Rating'}</Text>
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
