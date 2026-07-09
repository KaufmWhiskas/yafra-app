import { GroupFeedReview, GroupMember, Restaurant, Review } from '../types';

export interface ScoreBucket {
  score: number;
  count: number;
  percentage: number;
}

export interface ScoreDistribution {
  buckets: ScoreBucket[];
  maxCount: number;
}

/**
 * Calculates the weighted average rating for a specific restaurant based on
 * the opinions of an explicit group of members.
 *
 * @param restaurantId The target restaurant.
 * @param members The array of active group members containing their assigned weights.
 * @param allReviews An array of reviews (can be all reviews in the system, we will filter them).
 * @returns The weighted average rounded to 1 decimal place, or null if no valid reviews exist.
 */
export function calculateGroupAverage(
  restaurantId: string | number,
  members: GroupMember[],
  allReviews: Review[],
): number | null {
  const targetRestaurantId = restaurantId.toString();
  let totalWeight = 0;
  let totalWeightedRating = 0;

  for (const review of allReviews) {
    if (review.restaurant_id.toString() !== targetRestaurantId) continue;

    const member = members.find((m) => m.user_id === review.user_id);
    if (member && member.weight > 0) {
      totalWeight += member.weight;
      totalWeightedRating += review.rating * member.weight;
    }
  }

  if (totalWeight === 0) return null;
  return Math.round((totalWeightedRating / totalWeight) * 10) / 10;
}

/**
 * Calculates a unified score for a restaurant based exclusively on reviews
 * written by members of currently activated groups.
 *
 * @param reviews Filtered array of matching group reviews.
 * @returns A number between 0 and 5, rounded to one decimal place.
 */
export function calculateGroupMapScore(reviews: GroupFeedReview[]): number {
  if (!reviews || reviews.length === 0) return 0;

  const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
  const average = total / reviews.length;

  return Math.round(average * 10) / 10;
}

/**
 * Groups restaurants into 0.5-increment score buckets for bar chart visualization.
 * Ensures all buckets from 1.0 to 5.0 exist for a uniform X-axis.
 * @param restaurants The list of restaurants to analyze.
 * @returns An object containing the buckets and the max count for percentage calculation.
 */
export function calculateScoreDistribution(
  restaurants: Restaurant[],
): ScoreDistribution {
  // Pre-fill all valid increments so the chart layout remains fixed and uniform
  const buckets: Record<string, number> = {
    '5.0': 0,
    '4.5': 0,
    '4.0': 0,
    '3.5': 0,
    '3.0': 0,
    '2.5': 0,
    '2.0': 0,
    '1.5': 0,
    '1.0': 0,
  };

  let validRestaurantsCount = 0;

  for (const restaurant of restaurants) {
    const rating = restaurant.app_rating ?? restaurant.rating;
    if (rating === undefined || rating === null) continue;

    validRestaurantsCount++;
    const clampedRating = Math.max(1.0, Math.min(5.0, rating));
    // Round to nearest 0.5
    const bucketKey = (Math.round(clampedRating * 2) / 2).toFixed(1);

    if (buckets[bucketKey] !== undefined) {
      buckets[bucketKey] += 1;
    }
  }

  if (validRestaurantsCount === 0) {
    return { buckets: [], maxCount: 0 };
  }

  const maxCount = Math.max(...Object.values(buckets));

  const scoreBuckets: ScoreBucket[] = Object.entries(buckets)
    .map(([scoreStr, count]) => ({
      score: parseFloat(scoreStr),
      count,
      percentage: maxCount > 0 ? (count / maxCount) * 100 : 0,
    }))
    .sort((a, b) => b.score - a.score); // Sort from highest score to lowest

  return { buckets: scoreBuckets, maxCount };
}
