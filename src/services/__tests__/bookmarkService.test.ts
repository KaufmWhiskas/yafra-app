import { getBookmarks, toggleBookmark } from "../bookmarkService";
import { supabase } from "../supabase";

// 1. Scaffold Mocks
jest.mock("../supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  },
}));

describe("bookmarkService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("toggleBookmark", () => {
    it("adds a bookmark if the restaurant is not currently bookmarked", async () => {
      // Simulate no existing bookmark found
      // @ts-expect-error: custom mock property not on root client
      (supabase.maybeSingle as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: null,
      });
      // @ts-expect-error: custom mock property not on root client
      (supabase.insert as jest.Mock).mockResolvedValueOnce({ error: null });

      const result = await toggleBookmark("rest_123", "user_456");

      expect(supabase.from).toHaveBeenCalledWith("bookmarks");
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.select).toHaveBeenCalledWith("*");
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.insert).toHaveBeenCalledWith([
        { user_id: "user_456", restaurant_id: "rest_123" },
      ]);
      expect(result).toEqual({ bookmarked: true });
    });

    it("removes a bookmark if the restaurant is already bookmarked", async () => {
      // Simulate existing bookmark found
      // @ts-expect-error: custom mock property not on root client
      (supabase.maybeSingle as jest.Mock).mockResolvedValueOnce({
        data: { id: 1 },
        error: null,
      });
      // @ts-expect-error: custom mock property not on root client
      (supabase.delete as jest.Mock).mockReturnValueOnce(supabase);

      const result = await toggleBookmark("rest_123", "user_456");

      expect(supabase.from).toHaveBeenCalledWith("bookmarks");
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.delete).toHaveBeenCalled();
      expect(result).toEqual({ bookmarked: false });
    });
  });

  describe("getBookmarks", () => {
    it("fetches all bookmarks for a specific user and extracts restaurant details", async () => {
      const mockDbData = [
        {
          id: 1,
          restaurant_id: "rest_123",
          // Supabase joins nested relational data like this:
          restaurants: {
            id: "rest_123",
            name: "Pizza Place",
            cuisine: "pizza",
          },
        },
      ];

      // The final `.eq()` in the chain resolves the data
      // @ts-expect-error: custom mock property not on root client
      (supabase.eq as jest.Mock).mockResolvedValueOnce({
        data: mockDbData,
        error: null,
      });

      const result = await getBookmarks("user_456");

      expect(supabase.from).toHaveBeenCalledWith("bookmarks");
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.select).toHaveBeenCalledWith("*, restaurants(*)");
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.eq).toHaveBeenCalledWith("user_id", "user_456");
      expect(result).toEqual([{
        id: "rest_123",
        name: "Pizza Place",
        cuisine: "pizza",
      }]);
    });
  });
});
