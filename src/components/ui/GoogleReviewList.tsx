import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: string;
}

export default function GoogleReviewList({
  reviews,
}: {
  reviews?: GoogleReview[];
}) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <View style={styles.container}>
      {reviews.map((review, i) => (
        <View key={i} style={styles.reviewCard}>
          <Text style={styles.author}>
            {review.author_name} • {review.rating} ★
          </Text>
          <Text style={styles.text}>{review.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  author: { fontWeight: 'bold', marginBottom: 4 },
  text: { color: '#444' },
});
