import { act, renderHook } from "@testing-library/react-native";
import { useRestaurantReviews } from "../useRestaurantReviews";
import { fetchReviewsForRestaurant } from "../../services/reviewService";
import { fetchSharedGroupMemberIds } from "../../services/groupService";
import { sortReviewsByRelevance } from "../../utils/reviewSort";

jest.mock("../../services/reviewService");
jest.mock("../../services/groupService");
jest.mock("../../utils/reviewSort");
jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ session: { user: { id: "user_me" } } }),
}));

describe("useRestaurantReviews", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches reviews, shared user IDs, and calls the sorting utility", async () => {
    const mockReviews = [{ id: "1", user_id: "user_public" }];
    const mockSharedIds = new Set(["user_friend"]);
    const mockSortedReviews = [{ id: "sorted_1" }];

    (fetchReviewsForRestaurant as jest.Mock).mockResolvedValue(mockReviews);
    (fetchSharedGroupMemberIds as jest.Mock).mockResolvedValue(mockSharedIds);
    (sortReviewsByRelevance as jest.Mock).mockReturnValue(mockSortedReviews);

    const { result } = renderHook(() => useRestaurantReviews("rest_1"));

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchReviewsForRestaurant).toHaveBeenCalledWith("rest_1", "user_me");
    expect(fetchSharedGroupMemberIds).toHaveBeenCalledWith("user_me");
    expect(sortReviewsByRelevance).toHaveBeenCalledWith(
      mockReviews,
      "user_me",
      mockSharedIds,
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.reviews).toEqual(mockSortedReviews);
    expect(result.current.error).toBeNull();
  });

  it("handles errors during fetch", async () => {
    const errorMessage = "Fetch failed";
    (fetchReviewsForRestaurant as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );
    (fetchSharedGroupMemberIds as jest.Mock).mockResolvedValue(new Set());

    const { result } = renderHook(() => useRestaurantReviews("rest_1"));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.reviews).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
  });
});
