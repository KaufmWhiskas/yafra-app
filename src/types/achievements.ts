/**
 * Represents the static definition of an achievement from the catalog.
 */
export interface Achievement {
  id: string;
  code: AchievementCode;
  title: string;
  description: string;
  secret_description: string | null;
  is_secret: boolean;
  icon_name: string;
  target: number;
}

/**
 * Represents an achievement that has been unlocked by a user.
 */
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

/**
 * Defines the specific, unique codes for each achievement.
 * Using a string literal union type provides strict type-checking.
 */
export type AchievementCode =
  // 1. Unique Restaurant Milestones
  | 'COUNT_RESTAURANT_1'
  | 'COUNT_RESTAURANT_5'
  | 'COUNT_RESTAURANT_10'
  | 'COUNT_RESTAURANT_25'
  | 'COUNT_RESTAURANT_50'
  | 'COUNT_RESTAURANT_75'
  | 'COUNT_RESTAURANT_100'
  | 'COUNT_RESTAURANT_150'
  | 'COUNT_RESTAURANT_200'
  | 'COUNT_RESTAURANT_250'

  // 2. Total Review Submission Volumes
  | 'COUNT_REVIEW_1'
  | 'COUNT_REVIEW_5'
  | 'COUNT_REVIEW_10'
  | 'COUNT_REVIEW_25'
  | 'COUNT_REVIEW_50'
  | 'COUNT_REVIEW_75'
  | 'COUNT_REVIEW_100'
  | 'COUNT_REVIEW_150'
  | 'COUNT_REVIEW_200'
  | 'COUNT_REVIEW_250'

  // 3. Cuisine Type Diversity
  | 'COUNT_CUISINETYPE_1'
  | 'COUNT_CUISINETYPE_3'
  | 'COUNT_CUISINETYPE_5'
  | 'COUNT_CUISINETYPE_10'
  | 'COUNT_CUISINETYPE_15'
  | 'COUNT_CUISINETYPE_20'
  | 'COUNT_CUISINETYPE_30'

  // 4. Weekly Review Consistency Streaks
  | 'STREAK_WEEK_2'
  | 'STREAK_WEEK_3'
  | 'STREAK_WEEK_5'
  | 'STREAK_WEEK_10'
  | 'STREAK_WEEK_20'
  | 'STREAK_WEEK_35'
  | 'STREAK_WEEK_52'

  // 5. Dining Experience Modalities
  | 'COUNT_EXP_EATIN5'
  | 'COUNT_EXP_EATIN10'
  | 'COUNT_EXP_EATIN25'
  | 'COUNT_EXP_TAKEAWAY5'
  | 'COUNT_EXP_TAKEAWAY10'
  | 'COUNT_EXP_TAKEAWAY25'
  | 'COUNT_EXP_ORDER5'
  | 'COUNT_EXP_ORDER10'
  | 'COUNT_EXP_ORDER25'

  // 6. Spatial Step Clusters
  | 'SPATIAL_CLUSTER_3'
  | 'SPATIAL_CLUSTER_5'
  | 'SPATIAL_CLUSTER_10'
  | 'SPATIAL_CLUSTER_15'
  | 'SPATIAL_CLUSTER_25'

  // 7. Geographic Distance Delta Milestones
  | 'SPATIAL_DELTA_50KM'
  | 'SPATIAL_DELTA_100KM'
  | 'SPATIAL_DELTA_250KM'
  | 'SPATIAL_DELTA_500KM'
  | 'SPATIAL_DELTA_1000KM'
  | 'SPATIAL_DELTA_2500KM'
  | 'SPATIAL_DELTA_5000KM'
  | 'SPATIAL_DELTA_10000KM'

  // 8. Core Volumetric Staple Trackers
  | 'STAPLE_PIZZA_5'
  | 'STAPLE_PIZZA_10'
  | 'STAPLE_PIZZA_25'
  | 'STAPLE_TURKISH_5'
  | 'STAPLE_TURKISH_10'
  | 'STAPLE_TURKISH_25'
  | 'STAPLE_SUSHI_5'
  | 'STAPLE_SUSHI_10'
  | 'STAPLE_SUSHI_25'

  // 9. Non-Streak Event Actions
  | 'EVENT_SCORE_MIN'
  | 'EVENT_SCORE_MAX'
  | 'EVENT_WISHLIST_ADD'
  | 'EVENT_GROUP_ENGAGE'
  | 'EVENT_SOCIAL_FRIEND'
  | 'EVENT_SOCIAL_MATCH'
  | 'EVENT_SOCIAL_FOLLOWHIGH'
  | 'EVENT_SOCIAL_FOLLOWLOW'
  | 'EVENT_RESTAURANT_POPULAR'
  | 'EVENT_RESTAURANT_FIRST'
  | 'EVENT_BUDGET_MIN'
  | 'EVENT_BUDGET_MAX'
  | 'EVENT_CRITIC_DETAILED'
  | 'EVENT_SOCIAL_TAGGER';
