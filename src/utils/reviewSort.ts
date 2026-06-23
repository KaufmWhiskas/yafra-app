import { GroupFeedReview } from "../types";

export function sortReviewsByRelevance(
  reviews: GroupFeedReview[],
  currentUserId: string | null,
  sharedUserIds: Set<string>,
): GroupFeedReview[] {
  const getScore = (review: GroupFeedReview): number => {
    if (currentUserId && review.user_id === currentUserId) {
      return 3; // Highest priority: Current user's review
    }
    if (sharedUserIds.has(review.user_id)) {
      return 2; // Second priority: Shared group members
    }
    return 1; // Lowest priority: Public reviews
  };

  return [...reviews].sort((a, b) => {
    const scoreA = getScore(a);
    const scoreB = getScore(b);

    if (scoreA !== scoreB) {
      return scoreB - scoreA; // Sort by score descending
    }

    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA; // If scores are same, sort by date descending
  });
}
