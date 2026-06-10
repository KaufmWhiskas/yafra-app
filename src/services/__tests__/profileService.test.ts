import { fetchUserStats } from "../profileService";
import { supabase } from "../supabase";

jest.mock("../supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  },
}));

describe("Profile Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetchUserStats returns the total count of reviews and bookmarks for a given user id", async () => {
    // @ts-expect-error: custom mock
    (supabase.eq as jest.Mock)
      .mockResolvedValueOnce({ count: 5, error: null }) // reviews
      .mockResolvedValueOnce({ count: 12, error: null }); // bookmarks

    const stats = await fetchUserStats("user_123");

    expect(supabase.from).toHaveBeenNthCalledWith(1, "reviews");
    expect(supabase.from).toHaveBeenNthCalledWith(2, "bookmarks");
    // @ts-expect-error: custom mock
    expect(supabase.select).toHaveBeenCalledWith("*", {
      count: "exact",
      head: true,
    });
    // @ts-expect-error: custom mock
    expect(supabase.eq).toHaveBeenCalledWith("user_id", "user_123");

    expect(stats).toEqual({ reviewCount: 5, bookmarkCount: 12 });
  });
});
