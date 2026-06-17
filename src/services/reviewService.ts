import { supabase } from "./supabase";

/**
 * Adds reviews to the Supabase database
 * Note: Requires user to be authenticated
 */
export const submitReview = async (review: {
  restaurantId: string;
  rating: number;
  priceScore: number;
  isEatIn: boolean;
  tags: string[];
  description: string;
}) => {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (authError || !user) {
    throw new Error(
      "Authentication required to submit a review. User not logged in",
    );
  }

  const { data: insertData, error: insertError } = await supabase
    .from("reviews")
    .insert([
      {
        restaurant_id: Number(review.restaurantId),
        rating: review.rating,
        price_value_rating: review.priceScore || null,
        review_text: review.description || "",
        metadata: {
          is_eat_in: review.isEatIn ?? true,
          tags: review.tags || [],
        },
        user_id: user.id,
      },
    ])
    .select();

  if (insertError) {
    throw insertError;
  }
  return { success: true, data: insertData };
};

/**
 * Fetches the current user's latest rating for a specific restaurant.
 */
export const fetchPersonalRating = async (
  userId: string,
  restaurantId: string | number,
): Promise<number | undefined> => {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("user_id", userId)
    .eq("restaurant_id", restaurantId.toString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching personal rating:", error);
    return undefined;
  }

  return data && data.length > 0 ? data[0].rating : undefined;
};

/**
 * Fetches all reviews made by a specific user, including the joined restaurant data.
 */
export async function fetchUserReviewedRestaurants(userId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, restaurant:restaurants(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((review: Record<string, unknown>) => {
    const mappedReview = { ...review };
    if (mappedReview.restaurant) {
      const {
        google_rating,
        app_rating,
        user_ratings_total,
        details,
        ...rest
      } = mappedReview.restaurant as Record<string, unknown>;
      const parsedDetails = details as Record<string, unknown> | undefined;

      mappedReview.restaurant = {
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
      };
    }
    return mappedReview;
  });
}
