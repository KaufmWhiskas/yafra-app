import { supabase } from "./supabase";
import { Restaurant } from "../types";

export interface BookmarkCollection {
  id: string;
  name: string;
}

/**
 * Fetches a user's bookmark collections.
 * If none exist, automatically provisions a default 'Wishlist' collection.
 */
export async function fetchCollections(
  userId: string,
): Promise<BookmarkCollection[]> {
  const { data, error } = await supabase
    .from("bookmark_collections")
    .select("id, name")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  if (!data || data.length === 0) {
    const wishlist = await createCollection(userId, "Wishlist");
    return [wishlist];
  }

  return data as BookmarkCollection[];
}

/**
 * Fetches a user's bookmark collections along with the count of restaurants in each.
 */
export async function fetchCollectionSummaries(
  userId: string,
): Promise<(BookmarkCollection & { count: number })[]> {
  const { data, error } = await supabase
    .from("bookmark_collections")
    .select("id, name, bookmarks(id)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []).map(
    (c: { id: string; name: string; bookmarks?: { id: string }[] | null }) => ({
      id: c.id,
      name: c.name,
      count: c.bookmarks ? c.bookmarks.length : 0,
    }),
  );
}

/**
 * Fetches the full restaurant records saved within a specific collection.
 */
export async function fetchCollectionRestaurants(
  collectionId: string,
): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*, restaurants(*)")
    .eq("collection_id", collectionId);

  if (error) throw error;

  return (data || [])
    .map((row: { restaurants: Record<string, unknown> | null }) => {
      if (!row.restaurants) return null;

      const {
        google_rating,
        app_rating,
        user_ratings_total,
        details,
        ...rest
      } = row.restaurants;
      const parsedDetails = details as Record<string, unknown> | undefined;

      return {
        ...rest,
        details,
        rating: google_rating
          ? parseFloat(google_rating as string)
          : (parsedDetails?.rating ? Number(parsedDetails.rating) : undefined),
        app_rating: app_rating ? parseFloat(app_rating as string) : undefined,
        user_ratings_total: Number(
          user_ratings_total || parsedDetails?.user_ratings_total ||
            parsedDetails?.userRatingCount,
        ) || 0,
      } as unknown as Restaurant;
    })
    .filter((r): r is Restaurant => r != null);
}

/**
 * Creates a new bookmark collection for the user.
 */
export async function createCollection(
  userId: string,
  name: string,
): Promise<BookmarkCollection> {
  const { data, error } = await supabase
    .from("bookmark_collections")
    .insert([{ user_id: userId, name }])
    .select()
    .single();

  if (error) throw error;
  return data as BookmarkCollection;
}

/**
 * Toggles a restaurant in a specific bookmark collection.
 */
export async function toggleBookmarkInCollection(
  userId: string,
  restaurantId: string | number,
  collectionId: string,
  isCurrentlySaved: boolean,
): Promise<void> {
  if (isCurrentlySaved) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("restaurant_id", restaurantId.toString())
      .eq("collection_id", collectionId);
    if (error) throw error;
  } else {
    let targetCollectionId = collectionId;

    if (!targetCollectionId) {
      const collections = await fetchCollections(userId);
      const wishlist = collections.find((c) => c.name === "Wishlist");
      if (wishlist) {
        targetCollectionId = wishlist.id;
      }
    }

    const { error } = await supabase.from("bookmarks").insert([{
      user_id: userId,
      restaurant_id: restaurantId.toString(),
      collection_id: targetCollectionId,
    }]);
    if (error && error.code !== "23505") throw error;
  }
}

/**
 * Fetches a unique Set of restaurant IDs that a user has bookmarked across ALL collections.
 * Provides a fast cache for map and list views to toggle bookmark icons.
 */
export async function fetchUserBookmarkedRestaurantIds(
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("restaurant_id")
    .eq("user_id", userId);

  if (error) throw error;

  const ids = new Set<string>();
  for (const row of data || []) {
    if (row.restaurant_id) ids.add(row.restaurant_id.toString());
  }
  return ids;
}

/**
 * Fetches the specific collections a user has saved a restaurant into.
 */
export async function fetchRestaurantSavedCollectionIds(
  userId: string,
  restaurantId: string | number,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("collection_id")
    .eq("user_id", userId)
    .eq("restaurant_id", restaurantId.toString());

  if (error) throw error;

  const ids = new Set<string>();
  for (const row of data || []) {
    if (row.collection_id) ids.add(row.collection_id.toString());
  }
  return ids;
}

/**
 * Toggles a restaurant in the user's bookmarks (adds to default Wishlist if not saved, removes from ALL if saved).
 */
export async function toggleBookmark(
  userId: string,
  restaurantId: string | number,
): Promise<void> {
  const savedCollections = await fetchRestaurantSavedCollectionIds(
    userId,
    restaurantId,
  );
  const isCurrentlySaved = savedCollections.size > 0;

  if (isCurrentlySaved) {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("restaurant_id", restaurantId.toString());
    if (error) throw error;
  } else {
    await toggleBookmarkInCollection(userId, restaurantId, "", false);
  }
}
