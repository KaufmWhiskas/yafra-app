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
