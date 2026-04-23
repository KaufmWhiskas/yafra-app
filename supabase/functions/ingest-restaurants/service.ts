import { BoundingBox } from "./scanner.ts";

export async function fetchAndStoreRestaurants(
  bbox: BoundingBox,
  supabase: any, // TODO: We need to expand DatabaseClient to support upsert/insert
  customFetch: typeof fetch = fetch,
): Promise<void> {
  // TODO: Orchestration logic goes here
}
