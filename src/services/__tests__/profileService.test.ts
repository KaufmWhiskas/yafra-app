import { fetchUserStats } from "../profileService";
import { supabase } from "../supabase";

jest.mock("../supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  },
}));

describe("Profile Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetchUserStats returns the total count of reviews, unique restaurants, and bookmarks for a given user id", async () => {
    // @ts-expect-error: custom mock
    (supabase.eq as jest.Mock)
      .mockReturnValueOnce(supabase) // profile query resolves chain back to single()
      .mockResolvedValueOnce({
        data: [{ restaurant_id: "r1" }, { restaurant_id: "r1" }, {
          restaurant_id: "r2",
        }],
        error: null,
      }) // reviews
      .mockResolvedValueOnce({ count: 12, error: null }); // bookmarks
    // @ts-expect-error: custom mock
    (supabase.single as jest.Mock).mockResolvedValueOnce({
      data: { username: "cooltester" },
      error: null,
    });

    const stats = await fetchUserStats("user_123");

    expect(supabase.from).toHaveBeenNthCalledWith(1, "profiles");
    expect(supabase.from).toHaveBeenNthCalledWith(2, "reviews");
    expect(supabase.from).toHaveBeenNthCalledWith(3, "bookmarks");
    // @ts-expect-error: custom mock
    expect(supabase.select).toHaveBeenNthCalledWith(1, "username");
    // @ts-expect-error: custom mock
    expect(supabase.select).toHaveBeenNthCalledWith(2, "restaurant_id");
    // @ts-expect-error: custom mock
    expect(supabase.select).toHaveBeenNthCalledWith(3, "*", {
      count: "exact",
      head: true,
    });
    // @ts-expect-error: custom mock
    expect(supabase.eq).toHaveBeenNthCalledWith(1, "id", "user_123");
    // @ts-expect-error: custom mock
    expect(supabase.eq).toHaveBeenNthCalledWith(2, "user_id", "user_123");
    // @ts-expect-error: custom mock
    expect(supabase.eq).toHaveBeenNthCalledWith(3, "user_id", "user_123");

    expect(stats).toEqual({
      username: "cooltester",
      reviewCount: 3,
      uniqueRestaurantsVisited: 2,
      bookmarkCount: 12,
    });
  });
});
