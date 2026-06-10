import {
  createCollection,
  fetchCollections,
  fetchCollectionSummaries,
  fetchRestaurantSavedCollectionIds,
  fetchUserBookmarkedRestaurantIds,
  toggleBookmarkInCollection,
} from "../bookmarkService";
import { supabase } from "../supabase";

// 1. Scaffold Mocks
jest.mock("../supabase", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  },
}));

describe("bookmarkService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchCollections", () => {
    it("fetches collections successfully", async () => {
      // @ts-expect-error: custom mock property not on root client
      (supabase.order as jest.Mock).mockResolvedValueOnce({
        data: [{ id: "c1", name: "Favorites" }],
        error: null,
      });

      const result = await fetchCollections("user_123");
      expect(supabase.from).toHaveBeenCalledWith("bookmark_collections");
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.eq).toHaveBeenCalledWith("user_id", "user_123");
      expect(result).toEqual([{ id: "c1", name: "Favorites" }]);
    });

    it("creates a Wishlist collection if empty", async () => {
      // @ts-expect-error: custom mock property not on root client
      (supabase.order as jest.Mock).mockResolvedValueOnce({
        data: [],
        error: null,
      });
      // @ts-expect-error: custom mock property not on root client
      (supabase.single as jest.Mock).mockResolvedValueOnce({
        data: { id: "c2", name: "Wishlist" },
        error: null,
      });

      const result = await fetchCollections("user_123");
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.insert).toHaveBeenCalledWith([
        { user_id: "user_123", name: "Wishlist" },
      ]);
      expect(result).toEqual([{ id: "c2", name: "Wishlist" }]);
    });
  });

  describe("fetchCollectionSummaries", () => {
    it("returns collections with their item counts", async () => {
      // @ts-expect-error: custom mock property not on root client
      (supabase.order as jest.Mock).mockResolvedValueOnce({
        data: [
          {
            id: "c1",
            name: "Favorites",
            bookmarks: [{ id: "1" }, { id: "2" }],
          },
          { id: "c2", name: "Empty", bookmarks: [] },
        ],
        error: null,
      });

      const result = await fetchCollectionSummaries("user_123");
      expect(supabase.from).toHaveBeenCalledWith("bookmark_collections");
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.select).toHaveBeenCalledWith(
        "id, name, bookmarks(id)",
      );
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.eq).toHaveBeenCalledWith("user_id", "user_123");

      expect(result).toEqual([
        { id: "c1", name: "Favorites", count: 2 },
        { id: "c2", name: "Empty", count: 0 },
      ]);
    });
  });

  describe("createCollection", () => {
    it("inserts and returns a new collection", async () => {
      // @ts-expect-error: custom mock property not on root client
      (supabase.single as jest.Mock).mockResolvedValueOnce({
        data: { id: "c3", name: "Must Try" },
        error: null,
      });

      const result = await createCollection("user_123", "Must Try");
      expect(supabase.from).toHaveBeenCalledWith("bookmark_collections");
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.insert).toHaveBeenCalledWith([
        { user_id: "user_123", name: "Must Try" },
      ]);
      expect(result).toEqual({ id: "c3", name: "Must Try" });
    });
  });

  describe("toggleBookmarkInCollection", () => {
    it("deletes a bookmark if currently saved", async () => {
      // @ts-expect-error: custom mock property not on root client
      (supabase.eq as jest.Mock)
        .mockReturnValueOnce(supabase)
        .mockReturnValueOnce(supabase)
        .mockResolvedValueOnce({ error: null });

      await toggleBookmarkInCollection("user_1", "rest_1", "coll_1", true);
      expect(supabase.from).toHaveBeenCalledWith("bookmarks");
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.delete).toHaveBeenCalled();
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.eq).toHaveBeenCalledWith("user_id", "user_1");
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.eq).toHaveBeenCalledWith("restaurant_id", "rest_1");
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.eq).toHaveBeenCalledWith("collection_id", "coll_1");
    });

    it("inserts a bookmark if not currently saved", async () => {
      // @ts-expect-error: custom mock property not on root client
      (supabase.insert as jest.Mock).mockResolvedValueOnce({ error: null });

      await toggleBookmarkInCollection("user_1", "rest_1", "coll_1", false);
      expect(supabase.from).toHaveBeenCalledWith("bookmarks");
      // @ts-expect-error: custom mock property not on root client
      expect(supabase.insert).toHaveBeenCalledWith([{
        user_id: "user_1",
        restaurant_id: "rest_1",
        collection_id: "coll_1",
      }]);
    });
  });

  describe("fetchUserBookmarkedRestaurantIds", () => {
    it("returns a unique set of restaurant IDs", async () => {
      // @ts-expect-error: custom mock property not on root client
      (supabase.eq as jest.Mock).mockResolvedValueOnce({
        data: [
          { restaurant_id: "rest_1" },
          { restaurant_id: "rest_2" },
          { restaurant_id: "rest_1" },
        ],
        error: null,
      });

      const result = await fetchUserBookmarkedRestaurantIds("user_1");
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(2);
      expect(result.has("rest_1")).toBe(true);
    });
  });

  describe("fetchRestaurantSavedCollectionIds", () => {
    it("returns a set of collection IDs for a specific restaurant", async () => {
      // @ts-expect-error: custom mock property not on root client
      (supabase.eq as jest.Mock)
        .mockReturnValueOnce(supabase)
        .mockResolvedValueOnce({
          data: [{ collection_id: "coll_1" }, { collection_id: "coll_2" }],
          error: null,
        });

      const result = await fetchRestaurantSavedCollectionIds(
        "user_1",
        "rest_1",
      );
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(2);
      expect(result.has("coll_1")).toBe(true);
    });
  });
});
