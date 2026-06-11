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
    .select("*")
    .gte("latitude", bbox.minLat)
    .lte("latitude", bbox.maxLat)
    .gte("longitude", bbox.minLon)
    .lte("longitude", bbox.maxLon);

  if (error) {
    throw error;
  }

  return (data || []).map((r: Record<string, unknown>) => {
    const { google_rating, app_rating, user_ratings_total, ...rest } = r;
    return {
      ...rest,
      rating: google_rating ? parseFloat(google_rating as string) : undefined,
      app_rating: app_rating ? parseFloat(app_rating as string) : undefined,
      user_ratings_total: Number(user_ratings_total) || 0,
    };
  }) as Restaurant[];
}

/**
 * Fetches detailed high-detailed data for a specific restaurant from Google Places.
 * @param googlePlaceId The Google Place ID of the restaurant.
 * @throws Will throw an error if the function invocation fails.
 */
export async function fetchRestaurantDetails(
  googlePlaceId: string,
): Promise<Partial<Restaurant> | null> {
  const { data, error } = await supabase.functions.invoke<
    Record<string, unknown>
  >(
    "fetch-place-details",
    {
      body: { googlePlaceId },
    },
  );

  if (error) throw error;

  if (data) {
    const { data: localData } = await supabase
      .from("restaurants")
      .select("id, app_rating, group_rating")
      .eq("google_place_id", googlePlaceId)
      .maybeSingle();

    let localId = localData?.id;

    if (!localData) {
      // Auto-provision base row cleanly now that RLS policy permits it
      const { data: newRest, error: insertError } = await supabase
        .from("restaurants")
        .upsert(
          {
            google_place_id: googlePlaceId,
            name: data.name || "Unknown",
            cuisine: data.cuisine || "restaurant",
            location: `POINT(${data.longitude ?? 0} ${data.latitude ?? 0})`,
          },
          { onConflict: "google_place_id" },
        )
        .select("id")
        .maybeSingle();

      if (insertError) {
        console.error(
          "[fetchRestaurantDetails] Auto-ingest RLS/Schema Error:",
          insertError,
        );
      } else if (newRest) {
        localId = newRest.id;
      }
    }

    // Dynamic standard fallback lookup sequence
    let appRating = localData?.app_rating;
    if (localId && appRating == null) {
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("restaurant_id", localId.toString());

      if (reviews && reviews.length > 0) {
        appRating = reviews.reduce((sum, r) => sum + r.rating, 0) /
          reviews.length;
      }
    }

    return {
      ...data,
      id: localId,
      rating: data.rating ? Number(data.rating) : undefined,
      user_ratings_total: Number(data.user_ratings_total) || 0,
      app_rating: appRating != null ? Number(appRating) : undefined,
      group_rating: localData?.group_rating != null
        ? Number(localData.group_rating)
        : undefined,
      opening_hours: data.opening_hours || undefined,
    } as Partial<Restaurant>;
  }
  return null;
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
