import { supabase } from "./supabase";
import { Restaurant } from "../types";

/**
 * Toggles a bookmark for a specific user and restaurant.
 * If the bookmark exists, it is removed. Otherwise, it is added.
 *
 * @param restaurantId The ID of the restaurant (converted to string to prevent BigInt casting issues in Supabase).
 * @param userId The UUID of the authenticated user.
 * @returns An object indicating the new bookmark state.
 */
export async function toggleBookmark(
  restaurantId: string | number,
  userId: string,
): Promise<{ bookmarked: boolean }> {
  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("restaurant_id", restaurantId.toString())
    .maybeSingle();

  if (data) {
    await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("restaurant_id", restaurantId.toString());
    return { bookmarked: false };
  }

  const { error: insertError } = await supabase.from("bookmarks").insert([
    { user_id: userId, restaurant_id: restaurantId.toString() },
  ]);

  // If the insert fails because of the unique constraint (race condition),
  // it means it was already bookmarked, which is fine.
  if (insertError && insertError.code !== "23505") {
    throw insertError;
  }

  return { bookmarked: true };
}

/**
 * Retrieves all bookmarked restaurants for a specific user.
 *
 * @param userId The UUID of the authenticated user.
 * @returns An array of populated Restaurant objects.
 */
export async function getBookmarks(userId: string): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*, restaurants(*)")
    .eq("user_id", userId);

  if (error) throw error;

  // Supabase returns relational data nested under the foreign table name.
  // We extract the nested objects and filter out any failed or orphaned joins.
  return (data || [])
    .map((row: { restaurants: unknown }) => row.restaurants as Restaurant)
    .filter((restaurant) => restaurant != null);
}
