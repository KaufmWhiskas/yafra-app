import { supabase } from "./supabase";

/**
 * Adds reviews to the Supabase database
 * Note: Requires user to be authenticated
 * Authentication is WIP
 */
export const submitReview = async (review: {
  restaurantId: string;
  rating: number;
  priceValueRating: number;
  reviewText: string;
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
        restaurant_id: review.restaurantId.toString(),
        rating: review.rating,
        price_value_rating: review.priceValueRating,
        review_text: review.reviewText,
        user_id: user.id,
      },
    ])
    .select();

  if (insertError) {
    throw insertError;
  }
  return { success: true, data: insertData };
};
