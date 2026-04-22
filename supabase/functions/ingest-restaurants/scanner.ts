/** Represents a geographic bounding box. */
export interface BoundingBox {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

/** Minimal interface for the Supabase client to allow mocking. */
export interface DatabaseClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => Promise<{
        data: { last_scan_date: string }[] | null;
        error: Error | null;
      }>;
    };
  };
}

/**
 * Checks the database to determine if a bounding box has been scanned recently.
 * @param bbox The geographic area to check.
 * @param supabase The Supabase client instance.
 * @returns True if a scan occurred within the last 14 days, false otherwise.
 */
export async function shouldSkipScan(
  bbox: BoundingBox,
  supabase: DatabaseClient,
): Promise<boolean> {
  const bboxString =
    `${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon}`;

  const { data, error } = await supabase
    .from("scan_history")
    .select("last_scan_date")
    .eq("bbox", bboxString);

  if (error || !data || data.length === 0) return false;

  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const lastScanTime = new Date(data[0].last_scan_date).getTime();

  return (now - lastScanTime) < FOURTEEN_DAYS_MS;
}
