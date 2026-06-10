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
): Promise<{ reviewCount: number; bookmarkCount: number }> => {
  const [reviewsResponse, bookmarksResponse] = await Promise.all([
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    reviewCount: reviewsResponse.count || 0,
    bookmarkCount: bookmarksResponse.count || 0,
  };
};
