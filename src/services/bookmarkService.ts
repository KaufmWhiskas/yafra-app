import { supabase } from "./supabase";

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
    const { error } = await supabase.from("bookmarks").insert([{
      user_id: userId,
      restaurant_id: restaurantId.toString(),
      collection_id: collectionId,
    }]);
    // Ignore unique constraint violations if accidentally clicked twice
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
