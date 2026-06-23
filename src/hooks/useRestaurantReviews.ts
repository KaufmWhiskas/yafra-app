import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchReviewsForRestaurant } from "../services/reviewService";
import { fetchSharedGroupMemberIds } from "../services/groupService";
import { sortReviewsByRelevance } from "../utils/reviewSort";
import { GroupFeedReview } from "../types";

export function useRestaurantReviews(restaurantId?: string | number | null) {
  const { session } = useAuth();
  const currentUserId = session?.user?.id ?? null;

  const [reviews, setReviews] = useState<GroupFeedReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    if (!restaurantId) {
      setReviews([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [fetchedReviews, sharedUserIds] = await Promise.all([
        fetchReviewsForRestaurant(restaurantId, currentUserId),
        currentUserId
          ? fetchSharedGroupMemberIds(currentUserId)
          : new Set<string>(),
      ]);

      const sorted = sortReviewsByRelevance(
        fetchedReviews,
        currentUserId,
        sharedUserIds,
      );
      setReviews(sorted);
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : "Failed to load reviews.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, currentUserId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return { reviews, isLoading, error, reload: loadReviews };
}
