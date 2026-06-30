import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { GroupFeedReview } from '../../types';
import { Avatar } from '../Avatar'; // Import our optimized Avatar component

interface FeedCardProps {
  review: GroupFeedReview;
}

export default function FeedCard({ review }: FeedCardProps) {
  const author = review.profiles?.username || 'Anonymous';
  const restaurantName = review.restaurant?.name || 'Unknown Restaurant';
  const date = review.visit_date || review.created_at || 'Unknown date';
  const parsedDate = Date.parse(date);
  const displayDate = Number.isNaN(parsedDate)
    ? date
    : new Date(date).toLocaleDateString();
  const avatarUrl = review.profiles?.avatar_url;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        {/* Swapped raw Image element for custom Avatar component to enforce cache-busting */}
        <Avatar url={avatarUrl} name={author} size={42} />

        <View style={styles.headingText}>
          <Text style={styles.authorText}>{author}</Text>
          <Text style={styles.restaurantText}>{restaurantName}</Text>
        </View>

        <View style={styles.ratingBadge}>
          <MaterialCommunityIcons name="star" size={14} color="#fff" />
          <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
        </View>
      </View>

      <Text style={styles.dateText}>{displayDate}</Text>

      {review.review_text ? (
        <Text style={styles.description} numberOfLines={3}>
          {review.review_text}
        </Text>
      ) : null}

      <View style={styles.tagRow}>
        {review.metadata?.tags?.slice(0, 4).map((tag) => (
          <View key={tag} style={styles.tagChip}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  headingText: {
    flex: 1,
    marginLeft: SIZES.base, // Added to account for space after Avatar component removal of margin
  },
  authorText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  restaurantText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  ratingText: {
    marginLeft: 4,
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  dateText: {
    color: COLORS.textLight,
    fontSize: 12,
    marginBottom: SIZES.base,
  },
  description: {
    color: COLORS.text,
    fontSize: 14,
    marginBottom: SIZES.base,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
    marginBottom: -3,
  },
  tagChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: COLORS.textLight,
    fontSize: 12,
  },
});
