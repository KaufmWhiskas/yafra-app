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
  user_ratings_total?: number;
  opening_hours?: string[];
  group_rating?: number;
  address?: string;
  google_reviews?: {
    author_name: string;
    rating: number;
    text: string;
    time: string;
  }[];
}

export type GroupRole = 'owner' | 'admin' | 'trusted' | 'member';

export interface Group {
  id: string;
  name: string;
  created_by: string;
  is_global: boolean;
  avatar_url?: string | null;
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

export interface GroupInvite {
  id: string;
  group_id: string;
  created_by: string;
  code: string;
  max_uses: number;
  used_count: number;
  expires_at: string;
  created_at: string;
  profiles?: { username: string };
}

export interface Review {
  id: string | number;
  restaurant_id: string;
  user_id: string;
  rating: number;
  price_value_rating?: number;
  review_text?: string;
  visit_date?: string | null;
  metadata?: { tags: string[] };
  is_private?: boolean;
  created_at?: string;
}

export interface GroupFeedReview extends Review {
  profiles?: {
    username?: string;
    avatar_url?: string;
  };
  restaurant?: {
    id?: string | number;
    name?: string;
    cuisine?: string;
  };
}

export interface Prediction {
  description: string;
  placeId: string;
  types?: string[];
  distance?: string; // e.g., "1.2 km"
  rating?: number; // Autocomplete API doesn't provide this, but useful for future expansion
}

export interface SearchRequest {
  query: string;
  latitude?: number;
  longitude?: number;
}
