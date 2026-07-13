import { supabase } from './supabase';
import {
  Achievement,
  AchievementCode,
  UserAchievement,
} from '../types/achievements';

export interface AchievementWithProgress extends Achievement {
  isUnlocked: boolean;
  currentProgress: number;
  globalUnlockPercentage: number;
}

/**
 * Fetches all achievements a user has unlocked.
 * @param userId The ID of the user.
 * @returns A promise resolving to an array of UserAchievement objects.
 */
export async function fetchUserAchievements(
  userId: string,
): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to fetch user achievements', error);
    return [];
  }
  return data;
}

/**
 * Fetches the entire catalog of available achievements.
 * @returns A promise resolving to an array of Achievement objects.
 */
export async function fetchAchievementCatalog(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements_catalog')
    .select('*');
  if (error) {
    console.error('Failed to fetch achievement catalog', error);
    return [];
  }
  return data as Achievement[];
}

/**
 * Fetches the entire achievement list enriched with local user progress parameters
 * and global unlock rarity metrics.
 */
export async function fetchAchievementsWithProgress(
  userId: string,
): Promise<AchievementWithProgress[]> {
  const [
    catalogRes,
    userUnlocksRes,
    reviewsRes,
    totalUsersRes,
    globalUnlocksRes,
  ] = await Promise.all([
    supabase.from('achievements_catalog').select('*'),
    supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId),
    supabase.from('reviews').select('restaurant_id').eq('user_id', userId),
    supabase.rpc('get_total_user_count'), // Remote Procedure Call helper or simple count select query
    supabase.from('user_achievements').select('achievement_id'),
  ]);

  const catalog = (catalogRes.data || []) as Achievement[];
  const unlockedAchievementIds = new Set(
    (userUnlocksRes.data || []).map((a) => a.achievement_id),
  );

  // Create a map from achievement ID to achievement code for efficient lookups.
  const catalogIdToCodeMap = new Map<string, AchievementCode>();
  catalog.forEach((ach) => {
    catalogIdToCodeMap.set(ach.id, ach.code);
  });

  // Calculate dynamic user progression counts
  const totalReviews = reviewsRes.data?.length || 0;
  const uniqueRestaurants = new Set(
    reviewsRes.data?.map((r) => r.restaurant_id) || [],
  ).size;

  // Build global metric distribution map
  const totalUsersCount = Number(totalUsersRes.data) || 1;
  const unlockCounts: Record<string, number> = {};
  (globalUnlocksRes.data || []).forEach((row) => {
    const code = catalogIdToCodeMap.get(row.achievement_id);
    if (code) {
      unlockCounts[code] = (unlockCounts[code] || 0) + 1;
    }
  });

  return catalog.map((ach) => {
    const isUnlocked = unlockedAchievementIds.has(ach.id);
    let currentProgress = 0;

    const parts = ach.code.split('_');
    if (parts[0] === 'COUNT') {
      currentProgress =
        parts[1] === 'REVIEW' ? totalReviews : uniqueRestaurants;
    }

    const globalCount = unlockCounts[ach.code] || 0;
    const globalUnlockPercentage = Math.round(
      (globalCount / totalUsersCount) * 100,
    );

    return {
      ...ach,
      isUnlocked,
      currentProgress: isUnlocked
        ? ach.target
        : Math.min(currentProgress, ach.target),
      globalUnlockPercentage: Math.max(
        globalUnlockPercentage,
        isUnlocked ? 1 : 0,
      ),
    };
  });
}

/**
 * Processes a review to check for and unlock any relevant achievements.
 * This is the main entry point for the achievement engine.
 * @param reviewPayload The payload of the review that was just submitted.
 * @param userId The ID of the user who submitted the review.
 * @returns A promise resolving to an array of newly unlocked achievements.
 */
export async function processReviewAchievements(
  reviewPayload: {
    restaurantId: string;
    description: string;
    taggedUserIds?: string[];
  },
  userId: string,
): Promise<Achievement[]> {
  try {
    const [catalog, userAchievements, userReviews] = await Promise.all([
      fetchAchievementCatalog(),
      fetchUserAchievements(userId),
      supabase.from('reviews').select('restaurant_id').eq('user_id', userId),
    ]);

    const catalogIdMap = new Map<string, AchievementCode>();
    for (const ach of catalog) {
      catalogIdMap.set(ach.id, ach.code);
    }

    const unlockedCodes = new Set<AchievementCode>();
    for (const uach of userAchievements) {
      const code = catalogIdMap.get(uach.achievement_id);
      if (code) unlockedCodes.add(code);
    }
    const achievementsToUnlock: Partial<UserAchievement>[] = [];
    const newlyUnlockedAchievements: Achievement[] = [];

    const totalReviews = (userReviews.data?.length || 0) + 1;
    const uniqueRestaurants = new Set([
      ...(userReviews.data?.map((r) => r.restaurant_id) || []),
      reviewPayload.restaurantId,
    ]);

    for (const achievement of catalog) {
      if (unlockedCodes.has(achievement.code)) continue;

      const parts = achievement.code.split('_');
      const category = parts[0]; // 'COUNT', 'EVENT', etc.
      const target = achievement.target;
      let shouldUnlock = false;

      if (category === 'COUNT') {
        const subject = parts[1]; // 'REVIEW' or 'RESTAURANT'
        if (subject === 'REVIEW' && totalReviews >= target) {
          shouldUnlock = true;
        }
        if (subject === 'RESTAURANT' && uniqueRestaurants.size >= target) {
          shouldUnlock = true;
        }
      } else if (category === 'EVENT') {
        // Check whole string matches directly to guarantee code name precision
        if (
          achievement.code === 'EVENT_CRITIC_DETAILED' &&
          reviewPayload.description.length > 25
        ) {
          shouldUnlock = true;
        }
        if (
          achievement.code === 'EVENT_SOCIAL_TAGGER' &&
          (reviewPayload.taggedUserIds?.length || 0) > 0
        ) {
          shouldUnlock = true;
        }
      }

      if (shouldUnlock) {
        achievementsToUnlock.push({
          user_id: userId,
          achievement_id: achievement.id,
        });
        newlyUnlockedAchievements.push(achievement);
      }
    }

    if (achievementsToUnlock.length > 0) {
      await supabase.from('user_achievements').insert(achievementsToUnlock);
    }

    return newlyUnlockedAchievements;
  } catch (error) {
    console.error('Error processing achievements:', error);
    return [];
  }
}
