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
 * Directly unlocks an event-based achievement from the client side.
 * Returns the Achievement object if newly unlocked so the UI can trigger an Alert.
 */
export async function unlockDirectEvent(
  code: AchievementCode,
  userId: string,
): Promise<Achievement | null> {
  console.log(
    `[Achievement Engine] Attempting to unlock: ${code} for user: ${userId}`,
  );

  try {
    // 1. Fetch catalog item ID
    const { data: catalogItem, error: catalogError } = await supabase
      .from('achievements_catalog')
      .select('*')
      .eq('code', code)
      .single();

    if (catalogError || !catalogItem) {
      console.error(
        `[Achievement Engine] Catalog look-up failed for code ${code}:`,
        catalogError,
      );
      return null;
    }

    console.log(
      `[Achievement Engine] Found catalog item: ${catalogItem.title} (${catalogItem.id})`,
    );

    // 2. Check if already unlocked
    const { data: existing, error: checkError } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)
      .eq('achievement_id', catalogItem.id);

    if (checkError) {
      console.error('[Achievement Engine] Validation check error:', checkError);
    }

    if (existing && existing.length > 0) {
      console.log(
        `[Achievement Engine] Achievement already unlocked for this user. Aborting silently.`,
      );
      return null; // Already unlocked! This is likely what is happening.
    }

    // 3. Perform insert transaction
    console.log(
      `[Achievement Engine] Inserting new row into user_achievements...`,
    );
    const { error: insertError } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: catalogItem.id,
      });

    if (insertError) {
      console.error(
        `[Achievement Engine] Postgres insertion rejected for ${code}:`,
        insertError,
      );
      return null;
    }

    console.log(
      `[Achievement Engine] Successfully unlocked ${code}! Firing UI Alert.`,
    );
    return catalogItem as Achievement;
  } catch (error) {
    console.error(
      `[Achievement Engine] Fatal exception in direct unlock for ${code}:`,
      error,
    );
    return null;
  }
}
