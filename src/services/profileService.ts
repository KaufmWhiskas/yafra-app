import { supabase } from "./supabase";

export interface UserProfile {
  email: string;
  reviewCount: number;
}

export const fetchUserProfile = async (): Promise<UserProfile> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error("User not logged in");

  const { count } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return { email: user.email, reviewCount: count || 0 };
};

export const fetchUserStats = async (
  userId: string,
): Promise<
  {
    username: string;
    reviewCount: number;
    uniqueRestaurantsVisited: number;
    bookmarkCount: number;
  }
> => {
  const [profileResponse, reviewsResponse, bookmarksResponse] = await Promise
    .all([
      supabase.from("profiles").select("username").eq("id", userId).single(),
      supabase.from("reviews").select("restaurant_id").eq("user_id", userId),
      supabase.from("bookmarks").select("*", { count: "exact", head: true }).eq(
        "user_id",
        userId,
      ),
    ]);

  const rawReviews = reviewsResponse.data || [];
  const uniqueVisited =
    new Set(rawReviews.map((r) => r.restaurant_id?.toString())).size;

  return {
    username: profileResponse.data?.username || "Unknown User",
    reviewCount: rawReviews.length,
    uniqueRestaurantsVisited: uniqueVisited,
    bookmarkCount: bookmarksResponse.count || 0,
  };
};

/**
 * Updates the user's profile name, enforcing a 7-day cooldown between changes.
 * @param userId The unique identifier of the user.
 * @param newName The new username to apply.
 * @throws Will throw an error if the update fails or the cooldown is still active.
 */
export async function updateProfileName(
  userId: string,
  newName: string,
): Promise<void> {
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("last_name_change")
    .eq("id", userId)
    .single();

  if (fetchError) throw fetchError;

  if (profile?.last_name_change) {
    const lastChange = new Date(profile.last_name_change).getTime();
    const daysSinceChange = (Date.now() - lastChange) / (1000 * 60 * 60 * 24);

    if (daysSinceChange < 7) {
      const daysLeft = Math.ceil(7 - daysSinceChange);
      throw new Error(`Name changes are locked for ${daysLeft} more day(s).`);
    }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      username: newName,
      last_name_change: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) throw updateError;
}

/**
 * Submits beta feedback from the user.
 */
export async function submitBetaFeedback(
  userId: string,
  message: string,
): Promise<void> {
  const { error } = await supabase
    .from("beta_feedback")
    .insert([{ user_id: userId, message }]);

  if (error) throw error;
}
