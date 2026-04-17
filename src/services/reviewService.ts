import { supabase } from './supabase';

/**
 * Adds reviews to the Supabase database
 * Note: Requires user to be authenticated
 * Authentication is WIP
 */
export const submitReview = async (review: {
  restaurant_id: string | number;
  rating: number;
  description: string;
}) => {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (authError || !user) {
    throw new Error(
      'Authentication required to submit a review. User not logged in',
    );
  }

  const { data: insertData, error: insertError } = await supabase
    .from('reviews')
    .insert([
      {
        restaurant_id: review.restaurant_id.toString(),
        rating: review.rating,
        description: review.description,
        user_id: user.id,
      },
    ])
    .select();

  if (insertError) {
    throw insertError;
  }
  return { success: true, data: insertData };
};
