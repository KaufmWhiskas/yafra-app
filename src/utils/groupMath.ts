import { GroupMember, Review } from "../types";

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
