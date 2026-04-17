export const submitReview = async (review: {
  restaurant_id: string | number;
  rating: number;
  description: string;
}) => {
  console.log('Service received review', review);
  return { success: true };
};
