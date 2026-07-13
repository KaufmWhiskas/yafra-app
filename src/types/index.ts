/**
 * Represents a restaurant entity, combining data from the local database and Google Places.
 */
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
  /** Raw review data sourced directly from the Google Places API. */
  google_reviews?: {
    author_name: string;
    rating: number;
    text: string;
    time: string;
  }[];
}

/** Defines the permission levels for a user within a group. */
export type GroupRole = 'owner' | 'admin' | 'trusted' | 'member';

/**
 * Represents a user-created group or "circle".
 */
export interface Group {
  id: string;
  name: string;
  created_by: string;
  is_global: boolean;
  avatar_url?: string | null;
  permanent_invite_code: string;
  created_at: string;
}

/**
 * Represents the junction table record linking a user to a group.
 * Includes metadata about their membership.
 */
export interface GroupMember {
  group_id: string;
  user_id: string;
  role: GroupRole;
  weight: number;
  is_active_filter: boolean;
  joined_at: string;
}

/**
 * Represents a temporary, single-use or limited-use invite code for a group.
 */
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

/**
 * Represents a single review submitted by a user for a restaurant.
 */
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

/**
 * An extended review type used in group feeds, which includes nested profile
 * and restaurant information for display.
 */
export interface GroupFeedReview extends Review {
  profiles?: {
    username?: string;
    avatar_url?: string;
  };
  restaurant?: {
    id?: string | number;
    name?: string;
    cuisine?: string;
    google_place_id?: string;
  };
  /** An array of user profiles for friends who were tagged in this review. */
  tagged_friends?: UserProfile[];
}

/**
 * Represents a single autocomplete prediction from the Google Places API.
 */
export interface Prediction {
  description: string;
  placeId: string;
  types?: string[];
  distance?: string;
  rating?: number;
}

/**
 * Defines the payload for a search request to the place predictions service.
 */
export interface SearchRequest {
  query: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Represents the public-facing profile of a user.
 */
export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export type FriendStatus = 'pending' | 'accepted' | 'blocked';

export interface UserRelationship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendStatus;
  created_at: string;
  updated_at: string;
}

export interface UserRelationshipWithProfiles extends UserRelationship {
  requester: UserProfile;
  addressee: UserProfile;
}

export interface FriendProfile extends UserProfile {
  relationshipId: string;
}
