export interface Restaurant {
  id: string | number;
  name: string;
  cuisine: string;
  rating?: number;
  latitude: number;
  longitude: number;
  google_place_id?: string;
  app_rating?: number;
  app_review_count?: number;
}

export type GroupRole = "owner" | "admin" | "trusted" | "member";

export interface Group {
  id: string;
  name: string;
  created_by: string;
  is_global: boolean;
  permanent_invite_code: string;
  created_at: string; // ISO 8601 string
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: GroupRole;
  weight: number;
  is_active_filter: boolean;
  joined_at: string; // ISO 8601 string
}

export interface Review {
  id: string;
  restaurant_id: string;
  user_id: string;
  rating: number;
  price_value_rating?: number;
  review_text?: string;
}
