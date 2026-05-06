const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export interface DatabaseClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: { details: unknown; details_updated_at: string | null } | null;
          error: Error | null;
        }>;
      };
    };
    update: (payload: { details: unknown; details_updated_at: string }) => {
      eq: (column: string, value: string) => {
        select: () => Promise<{ data: unknown[] | null; error: Error | null }>;
      };
    };
  };
}

export async function getOrFetchPlaceDetails(
  placeId: string,
  apiKey: string,
  client: DatabaseClient,
  fetcher: (id: string, key: string) => Promise<unknown>,
) {
  const { data, error: selectError } = await client
    .from("restaurants")
    .select("details, details_updated_at")
    .eq("google_place_id", placeId)
    .maybeSingle();

  if (selectError) {
    console.error(
      "[getOrFetchPlaceDetails] Select Error:",
      selectError.message,
    );
  }

  if (data?.details && data.details_updated_at) {
    const cacheAgeMs = Date.now() - new Date(data.details_updated_at).getTime();
    if (cacheAgeMs < FOURTEEN_DAYS_MS) return data.details;
  }

  const freshDetails = await fetcher(placeId, apiKey);

  const { data: updatedRows, error: updateError } = await client.from(
    "restaurants",
  ).update({
    details: freshDetails,
    details_updated_at: new Date().toISOString(),
  }).eq("google_place_id", placeId).select();

  if (updateError) {
    console.error(
      "[getOrFetchPlaceDetails] Update Error:",
      updateError.message,
    );
  } else if (!updatedRows || updatedRows.length === 0) {
    console.warn(
      `[getOrFetchPlaceDetails] Warning: 0 rows updated. The base row for ${placeId} doesn't exist yet!`,
    );
  }

  return freshDetails;
}
