import { sortReviewsByRelevance } from "../reviewSort";
import { GroupFeedReview } from "../../types";

// Helper to create mock reviews
const createMockReview = (
  overrides: Partial<GroupFeedReview>,
): GroupFeedReview => ({
  id: Math.random().toString(),
  restaurant_id: "rest_1",
  user_id: "default_user",
  rating: 4,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe("sortReviewsByRelevance", () => {
  it("should sort reviews with current user first, then shared group members, then public", () => {
    const currentUserId = "user_me";
    const sharedUserIds = new Set(["user_friend_1", "user_friend_2"]);

    const reviews: GroupFeedReview[] = [
      // A public review (oldest)
      createMockReview({
        id: "public_1",
        user_id: "user_public_1",
        created_at: "2024-01-01T10:00:00Z",
      }),
      // A review from a shared group member (older)
      createMockReview({
        id: "friend_1",
        user_id: "user_friend_1",
        created_at: "2024-02-01T10:00:00Z",
      }),
      // The current user's review (somewhere in the middle chronologically)
      createMockReview({
        id: "my_review",
        user_id: "user_me",
        created_at: "2024-03-01T10:00:00Z",
      }),
      // Another public review (newest)
      createMockReview({
        id: "public_2",
        user_id: "user_public_2",
        created_at: "2024-05-01T10:00:00Z",
      }),
      // Another review from a shared group member (newest of the friends)
      createMockReview({
        id: "friend_2",
        user_id: "user_friend_2",
        created_at: "2024-04-01T10:00:00Z",
      }),
    ];

    const sortedReviews = sortReviewsByRelevance(
      reviews,
      currentUserId,
      sharedUserIds,
    );

    // Expected order:
    // 1. My review
    // 2. Friend 2's review (newest friend)
    // 3. Friend 1's review (older friend)
    // 4. Public 2's review (newest public)
    // 5. Public 1's review (older public)

    expect(sortedReviews.map((r) => r.id)).toEqual([
      "my_review",
      "friend_2",
      "friend_1",
      "public_2",
      "public_1",
    ]);
  });
});
