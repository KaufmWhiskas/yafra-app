/**
 * Handles persistence for restaurant reviews
 * Currently a placeholder for Supabase integration
 */
export const submitReview = async (review: {
  restaurant_id: string | number;
  rating: number;
  description: string;
}) => {
  // Real Supabase implementation will go here soon:tm:
  console.log('Service received review', review);
  return { success: true };
};
