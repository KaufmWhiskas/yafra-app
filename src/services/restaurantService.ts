import { supabase } from "./supabase";
import { Restaurant } from "../types";

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
 * Fetches all restaurants from the database.
 * @returns A promise resolving to an array of restaurant records.
 * @throws Will throw an error if the database query fails.
 */
export async function fetchRestaurants(
  bbox: BoundingBox,
): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*, reviews(id)")
    .gte("latitude", bbox.minLat)
    .lte("latitude", bbox.maxLat)
    .gte("longitude", bbox.minLon)
    .lte("longitude", bbox.maxLon);

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
        : (parsedDetails?.rating ? Number(parsedDetails.rating) : undefined),
      app_rating: app_rating ? parseFloat(app_rating as string) : undefined,
      app_review_count: reviews ? (reviews as unknown[]).length : 0,
      user_ratings_total: Number(
        user_ratings_total || parsedDetails?.user_ratings_total ||
          parsedDetails?.userRatingCount,
      ) || 0,
    };
  }) as unknown as Restaurant[];
}

/**
 * Fetches detailed high-detailed data for a specific restaurant from Google Places.
 * @param googlePlaceId The Google Place ID of the restaurant.
 * @throws Will throw an error if the function invocation fails.
 */
export async function fetchRestaurantDetails(
  googlePlaceId: string,
): Promise<Partial<Restaurant> | null> {
  // 1. Fetch the base row and check the cache
  const { data: localData, error: dbError } = await supabase
    .from("restaurants")
    .select(
      "id, app_rating, google_rating, user_ratings_total, details, details_updated_at",
    )
    .eq("google_place_id", googlePlaceId)
    .maybeSingle();

  if (dbError) {
    console.error("DB Fetch Error:", dbError);
  }

  let localId = localData?.id;
  let appRating = localData?.app_rating;
  let appReviewCount: number | undefined;

  // Always calculate the live average from the reviews table to bypass trigger latency.
  if (localId) {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("restaurant_id", localId.toString());

    if (reviews) {
      appReviewCount = reviews.length;
      if (reviews.length > 0) {
        appRating = reviews.reduce((sum, r) => sum + r.rating, 0) /
          reviews.length;
      } else {
        appRating = undefined;
      }
    }
  }

  // 2. Validate Cache (14 days expiry)
  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
  let isCacheValid = false;

  if (localData?.details && localData.details_updated_at) {
    const cacheAgeMs = Date.now() -
      new Date(localData.details_updated_at).getTime();
    if (cacheAgeMs < FOURTEEN_DAYS_MS) {
      isCacheValid = true;
    }
  }

  // 3. Cache Hit: Return local DB data instantly (Saves Google API $$)
  if (isCacheValid && localData) {
    const cachedDetails = localData.details as Record<string, unknown>;
    return {
      ...cachedDetails,
      id: localId,
      rating: cachedDetails.rating ? Number(cachedDetails.rating) : undefined,
      user_ratings_total: Number(
        cachedDetails.user_ratings_total || cachedDetails.userRatingCount,
      ) || 0,
      app_rating: appRating != null ? Number(appRating) : undefined,
      app_review_count: appReviewCount,
      opening_hours: cachedDetails.opening_hours || undefined,
    } as Partial<Restaurant>;
  }

  // 4. Cache Miss: Fetch fresh data from Google
  const { data: freshData, error: fetchError } = await supabase.functions
    .invoke<
      Record<string, unknown>
    >(
      "fetch-place-details",
      {
        body: { googlePlaceId },
      },
    );

  if (fetchError) throw fetchError;
  if (!freshData) return null;

  // 5. Update Database Cache
  if (!localData) {
    // Auto-provision base row cleanly with the fresh details
    const { data: newRest, error: insertError } = await supabase
      .from("restaurants")
      .upsert(
        {
          google_place_id: googlePlaceId,
          name: freshData.name || "Unknown",
          cuisine: freshData.cuisine || "restaurant",
          location: `POINT(${freshData.longitude ?? 0} ${
            freshData.latitude ?? 0
          })`,
          details: freshData, // <-- SAVE THE GOOGLE PAYLOAD
          details_updated_at: new Date().toISOString(),
        },
        { onConflict: "google_place_id" },
      )
      .select("id")
      .maybeSingle();

    if (insertError) {
      console.error("[fetchRestaurantDetails] Auto-ingest Error:", insertError);
    } else if (newRest) {
      localId = newRest.id;
    }
  } else {
    // Row exists, just update the JSONB cache
    await supabase
      .from("restaurants")
      .update({
        details: freshData, // <-- SAVE THE GOOGLE PAYLOAD
        details_updated_at: new Date().toISOString(),
      })
      .eq("id", localId);
  }

  return {
    ...freshData,
    id: localId,
    rating: freshData.rating
      ? Number(freshData.rating)
      : (localData?.google_rating
        ? Number(localData.google_rating)
        : undefined),
    user_ratings_total: Number(
      freshData.user_ratings_total || freshData.userRatingCount ||
        localData?.user_ratings_total,
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
    "ingest-restaurants",
    {
      body: { bbox },
    },
  );

  if (error) {
    throw error;
  }

  return data;
}
