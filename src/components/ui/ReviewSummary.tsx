import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ReviewSummaryProps {
  rating?: number;
  reviewCount?: number;
}

export default function ReviewSummary({
  rating = 0,
  reviewCount = 0,
}: ReviewSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.rating}>Rating: {rating}</Text>
      <Text style={styles.count}>({reviewCount} reviews)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  count: {
    fontSize: 14,
    color: '#666',
  },
});
