export interface RestaurantRecord {
  name: string;
  cuisine?: string;
  location: string;
  google_place_id?: string;
  google_rating?: number;
  details?: Record<string, unknown>;
}
