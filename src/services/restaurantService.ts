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

  if (error) {
    throw error;
  }

  if (data) {
    return {
      ...data,
      rating: data.rating ? Number(data.rating) : undefined,
      user_ratings_total: Number(data.user_ratings_total) || 0,
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
