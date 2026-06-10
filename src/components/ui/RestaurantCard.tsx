import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { Restaurant } from '../../types';
import { resolveRestaurantDisplay } from '../../utils/displayState';

interface RestaurantCardProps {
  item: Restaurant;
  /** Triggered when the user initiates the review flow */
  onPressReview?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  distance?: number;
}

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
 * Displays summarized restaurant information.
 */
export default function RestaurantCard({
  item,
  onPressReview,
  isBookmarked,
  onToggleBookmark,
  distance,
}: RestaurantCardProps) {
  const displayState = resolveRestaurantDisplay(item, isBookmarked);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View
            testID="restaurant-badge"
            style={[
              styles.badge,
              {
                backgroundColor: displayState.isHollow
                  ? '#ffffff'
                  : displayState.color,
                borderColor: displayState.color,
              },
            ]}
          >
            {displayState.display === 'bookmark-icon' ? (
              <MaterialCommunityIcons
                name="bookmark"
                size={12}
                color={displayState.isHollow ? displayState.color : '#fff'}
              />
            ) : displayState.display === 'unrated-icon' ? (
              <MaterialCommunityIcons
                name={getIconForCuisine(item.cuisine)}
                size={12}
                color={displayState.isHollow ? displayState.color : '#fff'}
              />
            ) : (
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: displayState.isHollow ? displayState.color : '#fff',
                  },
                ]}
              >
                {displayState.display}
              </Text>
            )}
          </View>
          <Text style={styles.title}>{item.name}</Text>
        </View>

        {onToggleBookmark && (
          <TouchableOpacity
            onPress={onToggleBookmark}
            testID="bookmark-button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isBookmarked ? COLORS.bookmark : COLORS.text}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.row}>
        <MaterialCommunityIcons
          name={getIconForCuisine(item.cuisine)}
          size={16}
          color={COLORS.text}
        />
        <Text style={styles.cuisineText}>{item.cuisine}</Text>
        {distance !== undefined && (
          <Text style={styles.distanceText}> • {distance.toFixed(1)} km</Text>
        )}
      </View>

      <View style={styles.ratingContainer}>
        {item.app_rating && item.app_review_count ? (
          <Text style={styles.ratingText}>
            {item.app_rating.toFixed(1)} ★ ({item.app_review_count} App Reviews)
          </Text>
        ) : null}

        {item.rating ? (
          <Text style={styles.googleRatingText}>
            {/* @ts-expect-error: extended google place property not yet strongly typed in interface */}
            {item.rating.toFixed(1)} ★ ({item.user_ratings_total || 0} Google
            Reviews)
          </Text>
        ) : null}

        {!item.app_rating && !item.rating && (
          <Text style={styles.ratingText}>Unrated</Text>
        )}
      </View>

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 8,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 36,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cuisineText: {
    marginLeft: 6,
    color: COLORS.text,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  distanceText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  ratingContainer: {
    marginBottom: 8,
  },
  googleRatingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
