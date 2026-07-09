import { supabase } from './supabase';
import { Restaurant } from '../types';

/**
 * Represents a geographic bounding box for map-based queries.
 */
interface BoundingBox {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

/**
 * Fetches restaurants within a given geographic bounding box.
 * Also joins and counts the number of app reviews for each restaurant.
 * @param bbox The geographic bounding box to search within.
 * @returns A promise that resolves to an array of restaurant records.
 * @throws Will throw an error if the database query fails.
 */
export async function fetchRestaurants(
  bbox: BoundingBox,
): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*, reviews(id)')
    .gte('latitude', bbox.minLat)
    .lte('latitude', bbox.maxLat)
    .gte('longitude', bbox.minLon)
    .lte('longitude', bbox.maxLon);

  if (error) {
    throw error;
  }

  return (data || []).map((r: Record<string, unknown>) => {
    const {
      google_rating,
      app_rating,
      user_ratings_total,
      details,
      reviews,
      ...rest
    } = r;
    const parsedDetails = details as Record<string, unknown> | undefined;

    return {
      ...rest,
      details,
      rating: google_rating
        ? parseFloat(google_rating as string)
        : parsedDetails?.rating
          ? Number(parsedDetails.rating)
          : undefined,
      app_rating: app_rating ? parseFloat(app_rating as string) : undefined,
      app_review_count: reviews ? (reviews as unknown[]).length : 0,
      user_ratings_total:
        Number(
          user_ratings_total ||
            parsedDetails?.user_ratings_total ||
            parsedDetails?.userRatingCount,
        ) || 0,
    };
  }) as unknown as Restaurant[];
}

/**
 * Fetches detailed data for a specific restaurant.
 * It first checks a local cache (14-day expiry). On a cache miss, it fetches
 * fresh data from the Google Places API via an edge function and updates the cache.
 * It also calculates the live `app_rating` and `app_review_count` to bypass database trigger latency.
 * @param googlePlaceId The Google Place ID of the restaurant.
 * @returns A promise resolving to a partial restaurant object with detailed data, or null.
 * @throws Will throw an error if the function invocation fails.
 */
export async function fetchRestaurantDetails(
  googlePlaceId: string,
): Promise<Partial<Restaurant> | null> {
  const { data: localData, error: dbError } = await supabase
    .from('restaurants')
    .select('id, app_rating, google_rating, details, details_updated_at')
    .eq('google_place_id', googlePlaceId)
    .maybeSingle();

  if (dbError) {
    console.error('DB Fetch Error:', dbError);
  }

  let localId = localData?.id;
  let appRating = localData?.app_rating;
  let appReviewCount: number | undefined;

  if (localId) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('restaurant_id', localId.toString());

    if (reviews) {
      appReviewCount = reviews.length;
      if (reviews.length > 0) {
        appRating =
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      } else {
        appRating = undefined;
      }
    }
  }

  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
  let isCacheValid = false;

  if (localData?.details && localData.details_updated_at) {
    const cacheAgeMs =
      Date.now() - new Date(localData.details_updated_at).getTime();
    if (cacheAgeMs < FOURTEEN_DAYS_MS) {
      isCacheValid = true;
    }
  }

  if (isCacheValid && localData) {
    const cachedDetails = localData.details as Record<string, unknown>;
    return {
      ...cachedDetails,
      id: localId,
      rating: cachedDetails.rating
        ? Number(cachedDetails.rating)
        : localData.google_rating
          ? parseFloat(localData.google_rating as string)
          : undefined,
      user_ratings_total:
        Number(
          cachedDetails.user_ratings_total || cachedDetails.userRatingCount,
        ) || 0,
      app_rating: appRating != null ? Number(appRating) : undefined,
      app_review_count: appReviewCount,
      opening_hours: cachedDetails.opening_hours || undefined,
    } as Partial<Restaurant>;
  }

  const { data: freshData, error: fetchError } =
    await supabase.functions.invoke<Record<string, unknown>>(
      'fetch-place-details',
      {
        body: { googlePlaceId },
      },
    );

  if (fetchError) throw fetchError;
  if (!freshData) return null;

  if (!localData) {
    const { data: newRest, error: insertError } = await supabase
      .from('restaurants')
      .upsert(
        {
          google_place_id: googlePlaceId,
          name: freshData.name || 'Unknown',
          cuisine: freshData.cuisine || 'restaurant',
          location: `POINT(${freshData.longitude ?? 0} ${
            freshData.latitude ?? 0
          })`,
          details: freshData,
          details_updated_at: new Date().toISOString(),
        },
        { onConflict: 'google_place_id' },
      )
      .select('id')
      .maybeSingle();

    if (insertError) {
      console.error('[fetchRestaurantDetails] Auto-ingest Error:', insertError);
    } else if (newRest) {
      localId = newRest.id;
    }
  } else {
    await supabase
      .from('restaurants')
      .update({
        details: freshData,
        details_updated_at: new Date().toISOString(),
      })
      .eq('id', localId);
  }

  return {
    ...freshData,
    id: localId,
    rating: freshData.rating
      ? Number(freshData.rating)
      : localData?.google_rating
        ? Number(localData.google_rating)
        : undefined,
    user_ratings_total:
      Number(
        freshData.user_ratings_total ||
          freshData.userRatingCount ||
          (localData?.details as Record<string, unknown> | undefined)
            ?.user_ratings_total ||
          (localData?.details as Record<string, unknown> | undefined)
            ?.userRatingCount,
      ) || 0,
    app_rating: appRating != null ? Number(appRating) : undefined,
    app_review_count: appReviewCount,
    opening_hours: freshData.opening_hours || undefined,
  } as Partial<Restaurant>;
}

/**
 * Triggers the Supabase Edge Function to ingest restaurants for a given area.
 * @param bbox The geographic bounding box to scan.
 * @throws Will throw an error if the function invocation fails.
 */
export async function triggerIngest(bbox: BoundingBox): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke<unknown>(
    'ingest-restaurants',
    {
      body: { bbox },
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchMapRestaurants(
  latitude: number,
  longitude: number,
  latitudeDelta: number,
  longitudeDelta: number,
  groupIds: string[] = [],
) {
  const minLat = latitude - latitudeDelta / 2;
  const maxLat = latitude + latitudeDelta / 2;
  const minLon = longitude - longitudeDelta / 2;
  const maxLon = longitude + longitudeDelta / 2;

  const { data, error } = await supabase
    .from('restaurants')
    .select(
      `
      id,
      name,
      cuisine,
      latitude,
      longitude,
      google_place_id,
      app_rating,
      google_rating,
      app_review_count,
      details
    `,
    )
    .gte('latitude', minLat)
    .lte('latitude', maxLat)
    .gte('longitude', minLon)
    .lte('longitude', maxLon);

  if (error) {
    console.error('Error fetching map markers:', error);
    return [];
  }

  type RawRestaurantData = {
    id: string | number;
    name: string;
    cuisine: string;
    latitude: number;
    longitude: number;
    google_place_id: string | null;
    app_rating: string | null;
    google_rating: string | null;
    app_review_count: number | null;
    details: Record<string, unknown> | null;
  };

  return ((data as RawRestaurantData[]) || []).map((r) => {
    const { google_rating, details, ...rest } = r;
    const parsedDetails = details;
    return {
      ...rest,
      rating: google_rating
        ? parseFloat(google_rating)
        : parsedDetails?.rating
          ? Number(parsedDetails.rating)
          : undefined,
      app_rating: r.app_rating ? parseFloat(r.app_rating) : undefined,
      app_review_count: r.app_review_count || 0,
      user_ratings_total:
        Number(
          parsedDetails?.user_ratings_total || parsedDetails?.userRatingCount,
        ) || 0,
    } as Restaurant;
  });
}

export async function fetchRestaurantGroupDetails(
  restaurantId: string,
  groupIds: string[],
) {
  if (!groupIds || groupIds.length === 0) return [];

  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id')
    .in('group_id', groupIds);

  if (membersError) throw membersError;
  const userIds = Array.from(new Set((members || []).map((m) => m.user_id)));
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from('reviews')
    .select(
      `
      id, rating, price_value_rating, review_text, visit_date, metadata, profiles (id, username, avatar_url)
    `,
    )
    .eq('restaurant_id', restaurantId)
    .in('user_id', userIds);

  if (error) {
    console.error('Error fetching restaurant group details:', error);
    return [];
  }
  return data || [];
}
