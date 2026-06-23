import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchGroupFeed } from "../services/groupService";
import { GroupFeedReview } from "../types";

export function useGroupFeed(groupId: string) {
  const { session } = useAuth();
  const [reviews, setReviews] = useState<GroupFeedReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroupFeed = useCallback(async () => {
    if (!groupId) {
      setReviews([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedReviews = await fetchGroupFeed(
        groupId,
        session?.user?.id ?? null,
      );
      setReviews(fetchedReviews);
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : "Failed to load group feed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, session?.user?.id]);

  useEffect(() => {
    loadGroupFeed();
  }, [loadGroupFeed]);

  return { reviews, isLoading, error, reload: loadGroupFeed };
}
