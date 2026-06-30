import { GroupFeedReview, GroupMember, Review } from '../types';

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
