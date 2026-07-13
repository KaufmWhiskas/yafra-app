import { supabase } from './supabase';
import { GroupFeedReview, UserProfile } from '../types';

type ReviewWithNestedTaggedUsers = Omit<GroupFeedReview, 'tagged_friends'> & {
  review_tagged_users: {
    profiles: UserProfile;
  }[];
};

/**
 * Submits a new review to the database and handles tagging users.
 * This function requires an authenticated user session.
 *
 * @param review The review data payload.
 * @returns A promise that resolves with the success status and the created review data.
 * @throws Will throw an error if the user is not authenticated or if the database insert fails.
 */
export const submitReview = async (review: {
  restaurantId: string;
  rating: number;
  priceScore: number | null;
  experienceType: 'eat-in' | 'takeaway' | 'order';
  tags: string[];
  description: string;
  visitDate?: string | null;
  isPrivate?: boolean;
  priceTier: number;
  taggedUserIds?: string[];
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
        restaurant_id: Number(review.restaurantId),
        rating: review.rating,
        price_value_rating: review.priceScore || null,
        review_text: review.description || '',
        visit_date: review.visitDate || null,
        metadata: {
          experience_type: review.experienceType,
          tags: review.tags || [],
          price_tier: review.priceTier,
          tagged_user_ids: review.taggedUserIds || [],
        },
        is_private: review.isPrivate || false,
        user_id: user.id,
      },
    ])
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  const newReviewId = insertData.id;

  if (review.taggedUserIds && review.taggedUserIds.length > 0) {
    const taggedUsers = review.taggedUserIds.map((userId) => ({
      review_id: newReviewId,
      user_id: userId,
    }));
    const { error: tagError } = await supabase
      .from('review_tagged_users')
      .insert(taggedUsers);

    if (tagError) {
      console.error('Failed to tag users in review:', tagError);
    }
  }

  return { success: true, data: insertData };
};

/**
 * Fetches the current user's latest rating for a specific restaurant.
 *
 * @param userId The ID of the user.
 * @param restaurantId The ID of the restaurant.
 * @returns A promise resolving to an object with the average rating and review count, or null if no reviews exist.
 */
export const fetchPersonalRating = async (
  userId: string,
  restaurantId: string | number,
): Promise<{ rating: number; count: number } | null> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId.toString());

  if (error) {
    console.error('Error fetching personal rating:', error);
    return null;
  }

  if (!data || data.length === 0) return null;

  // Calculate the true average of all the user's reviews for this place
  const sum = data.reduce((acc, row) => acc + row.rating, 0);
  const avg = sum / data.length;

  return { rating: avg, count: data.length };
};

/**
 * Fetches all reviews made by a specific user, including the joined restaurant data.
 *
 * @param userId The ID of the user whose reviews are to be fetched.
 * @returns A promise resolving to an array of the user's reviews with nested restaurant data.
 * @throws Will throw an error if the database query fails.
 */
export async function fetchUserReviewedRestaurants(userId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, restaurant:restaurants(*)')
    .eq('user_id', userId)
    .order('visit_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((review: Record<string, unknown>) => {
    const mappedReview = { ...review };
    if (mappedReview.restaurant) {
      // This block normalizes the restaurant data shape. The database might store
      // ratings as strings, and details from Google Places can have varying property names.
      // We consolidate these into a consistent `Restaurant` object structure for the app.
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
          : parsedDetails?.rating
            ? Number(parsedDetails.rating)
            : undefined,
        app_rating: app_rating ? parseFloat(app_rating as string) : undefined,
        user_ratings_total:
          Number(
            user_ratings_total ||
              parsedDetails?.user_ratings_total ||
              parsedDetails?.userRatingCount,
          ) || 0,
      };
    }
    return mappedReview;
  });
}

/**
 * Deletes a review from the database.
 * @param reviewId The ID of the review to delete.
 * @throws Will throw an error if the delete operation fails.
 */
export async function deleteReview(reviewId: number): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

  if (error) throw error;
}

/**
 * Fetches and sorts all tags previously used by the user, ordered by frequency.
 *
 * @param userId The ID of the user whose tags are to be fetched.
 * @returns A promise resolving to an array of unique tags, sorted by usage frequency.
 */
export async function fetchUserTags(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('metadata')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }

  const tagCounts: Record<string, number> = {};

  data.forEach((row) => {
    const tags =
      ((row.metadata as Record<string, unknown>)?.tags as string[]) || [];
    tags.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
}

/**
 * Fetches all relevant reviews for a restaurant.
 * This includes all public reviews, plus all of the current user's own reviews (even private ones).
 *
 * @param restaurantId The ID of the restaurant.
 * @param currentUserId The ID of the current user, to include their private reviews.
 * @returns A promise resolving to an array of `GroupFeedReview` objects.
 * @throws Will throw an error if the database query fails.
 */
export async function fetchReviewsForRestaurant(
  restaurantId: string | number,
  currentUserId: string | null,
): Promise<GroupFeedReview[]> {
  let query = supabase
    .from('reviews')
    .select(
      `*,
       profiles!user_id(username, avatar_url),
       restaurant:restaurants(id, name, cuisine),
       review_tagged_users(profiles!tagged_user_id(id, username, avatar_url))`,
    )
    .eq('restaurant_id', restaurantId);

  if (currentUserId) {
    query = query.or(
      `is_private.eq.false,is_private.is.null,user_id.eq.${currentUserId}`,
    );
  } else {
    query = query.or(`is_private.eq.false,is_private.is.null`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase Error fetching restaurant reviews:', error);
    // Force a standard Error object so the hook can read the message
    throw new Error(error.message);
  }

  // Manually map the nested tagged user profiles into a clean array
  const mappedData = (data as ReviewWithNestedTaggedUsers[]).map((review) => {
    const { review_tagged_users, ...rest } = review;
    const tagged_friends =
      review_tagged_users?.map((rtu) => rtu.profiles) || [];
    return { ...rest, tagged_friends };
  });

  return mappedData as GroupFeedReview[];
}

/**
 * Updates an existing review in the Supabase database.
 * It also clears and re-inserts tagged user relationships for the review.
 *
 * @param reviewId The ID of the review to update.
 * @param review The new review data payload.
 * @returns A promise that resolves with a success status.
 * @throws Will throw an error if the update operation fails.
 */
export const updateReview = async (
  reviewId: number | string,
  review: {
    rating: number;
    priceScore: number | null;
    experienceType: 'eat-in' | 'takeaway' | 'order';
    tags: string[];
    description: string;
    visitDate?: string | null;
    isPrivate?: boolean;
    priceTier: number;
    taggedUserIds?: string[];
  },
) => {
  const { error } = await supabase
    .from('reviews')
    .update({
      rating: review.rating,
      price_value_rating: review.priceScore || null,
      review_text: review.description || '',
      visit_date: review.visitDate || null,
      metadata: {
        experience_type: review.experienceType,
        tags: review.tags || [],
        price_tier: review.priceTier,
        tagged_user_ids: review.taggedUserIds || [],
      },
      is_private: review.isPrivate || false,
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;

  const { error: deleteError } = await supabase
    .from('review_tagged_users')
    .delete()
    .eq('review_id', reviewId);

  if (deleteError) {
    console.error('Failed to clear old tagged users:', deleteError);
  }

  if (review.taggedUserIds && review.taggedUserIds.length > 0) {
    const taggedUsers = review.taggedUserIds.map((userId) => ({
      review_id: reviewId,
      user_id: userId,
    }));
    const { error: insertError } = await supabase
      .from('review_tagged_users')
      .insert(taggedUsers);
    if (insertError) {
      console.error('Failed to insert new tagged users:', insertError);
    }
  }

  return { success: true };
};
