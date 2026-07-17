import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';

// Helper: Calculate distance between two lat/lng coordinates in km (Haversine Formula)
export function getDistanceKM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Google Places API Keyword Mapping for rigid staple achievement matching
const CUISINE_DICTIONARY: Record<string, string[]> = {
  turkish: [
    'turkish_restaurant',
    'middle_eastern_restaurant',
    'kebab_shop',
    'doner',
  ],
  pizza: ['pizza_restaurant', 'pizza'],
  sushi: ['sushi_restaurant', 'sushi'], // Strictly excludes 'japanese_restaurant' by omission
};

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use SERVICE_ROLE for full history bypass
  );

  const { payload, userId } = await req.json();

  try {
    // 1. Fetch Catalog, Unlocks, History, AND Non-Review Sync Data
    const [
      catalogRes,
      userUnlocksRes,
      reviewsRes,
      friendsReviewsRes,
      globalReviewsCountRes,
      bookmarksRes,
      groupsRes,
      friendsRes,
    ] = await Promise.all([
      supabaseClient.from('achievements_catalog').select('*'),
      supabaseClient
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId),
      supabaseClient
        .from('reviews')
        .select(
          `id, rating, review_text, created_at, visit_date, metadata, restaurant:restaurants(id, latitude, longitude, cuisine)`,
        )
        .eq('user_id', userId),
      supabaseClient
        .from('reviews')
        .select('user_id, rating')
        .eq('restaurant_id', payload.restaurant.id)
        .neq('user_id', userId),
      supabaseClient
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', payload.restaurant.id),
      supabaseClient
        .from('bookmarks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabaseClient
        .from('group_members')
        .select('group_id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabaseClient
        .from('user_relationships')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
    ]);

    const catalog = catalogRes.data || [];
    const unlockedIds = new Set(
      (userUnlocksRes.data || []).map((a) => a.achievement_id),
    );
    const history = reviewsRes.data || [];
    const friendReviews = friendsReviewsRes.data || [];
    const totalGlobalReviews = globalReviewsCountRes.count || 0;

    const bookmarksCount = bookmarksRes.count || 0;
    const groupsCount = groupsRes.count || 0;
    const friendsCount = friendsRes.count || 0;

    let currentRestaurantDetails = payload.restaurant;
    if (
      !currentRestaurantDetails?.latitude ||
      !currentRestaurantDetails?.cuisine
    ) {
      const targetId = payload.restaurantId || payload.restaurant?.id;
      let dbQuery = supabaseClient
        .from('restaurants')
        .select('id, latitude, longitude, cuisine');

      if (
        typeof targetId === 'number' ||
        (!isNaN(Number(targetId)) && targetId !== '')
      ) {
        dbQuery = dbQuery.eq('id', Number(targetId));
      } else {
        dbQuery = dbQuery.eq(
          'google_place_id',
          targetId || payload.restaurant?.google_place_id || '',
        );
      }

      const { data: dbRest } = await dbQuery.maybeSingle();
      if (dbRest) currentRestaurantDetails = dbRest;
    }

    const currentReview = {
      rating: payload.rating,
      review_text: payload.description || '',
      visit_date: payload.visitDate || new Date().toISOString(),
      metadata: {
        experience_type: payload.experienceType,
        tags: payload.tags,
        price_tier: payload.priceTier,
        tagged_user_ids: payload.taggedUserIds || [],
      },
      restaurant: currentRestaurantDetails,
    };

    // Ignore the neutral Sync Engine pivot point so it doesn't inflate counts
    const fullHistory =
      payload.restaurant?.google_place_id === 'sync_engine_fallback_pivot'
        ? history
        : [...history, currentReview];

    const unlockedAchievements = [];
    const totalReviews = fullHistory.length;
    const uniqueRestaurants = new Set(fullHistory.map((r) => r.restaurant?.id))
      .size;
    const cuisinesTried = new Set(
      fullHistory
        .map((r) => r.restaurant?.cuisine?.toLowerCase().trim())
        .filter(Boolean),
    ).size;

    const TARGET_MAP: Record<string, number> = {
      COUNT_REVIEW_1: 1,
      COUNT_REVIEW_5: 5,
      COUNT_REVIEW_10: 10,
      COUNT_REVIEW_25: 25,
      COUNT_REVIEW_50: 50,
      COUNT_REVIEW_75: 75,
      COUNT_REVIEW_100: 100,
      COUNT_REVIEW_150: 150,
      COUNT_REVIEW_200: 200,
      COUNT_REVIEW_250: 250,
      COUNT_RESTAURANT_1: 1,
      COUNT_RESTAURANT_5: 5,
      COUNT_RESTAURANT_10: 10,
      COUNT_RESTAURANT_25: 25,
      COUNT_RESTAURANT_50: 50,
      COUNT_RESTAURANT_75: 75,
      COUNT_RESTAURANT_100: 100,
      COUNT_RESTAURANT_150: 150,
      COUNT_RESTAURANT_200: 200,
      COUNT_RESTAURANT_250: 250,
      COUNT_CUISINETYPE_1: 1,
      COUNT_CUISINETYPE_3: 3,
      COUNT_CUISINETYPE_5: 5,
      COUNT_CUISINETYPE_10: 10,
      COUNT_CUISINETYPE_15: 15,
      COUNT_CUISINETYPE_20: 20,
      COUNT_CUISINETYPE_30: 30,
      STREAK_WEEK_2: 2,
      STREAK_WEEK_3: 3,
      STREAK_WEEK_5: 5,
      STREAK_WEEK_10: 10,
      STREAK_WEEK_20: 20,
      STREAK_WEEK_35: 35,
      STREAK_WEEK_52: 52,
      COUNT_EXP_EATIN5: 5,
      COUNT_EXP_EATIN10: 10,
      COUNT_EXP_EATIN25: 25,
      COUNT_EXP_TAKEAWAY5: 5,
      COUNT_EXP_TAKEAWAY10: 10,
      COUNT_EXP_TAKEAWAY25: 25,
      COUNT_EXP_ORDER5: 5,
      COUNT_EXP_ORDER10: 10,
      COUNT_EXP_ORDER25: 25,
      SPATIAL_CLUSTER_3: 3,
      SPATIAL_CLUSTER_5: 5,
      SPATIAL_CLUSTER_10: 10,
      SPATIAL_CLUSTER_15: 15,
      SPATIAL_CLUSTER_25: 25,
      SPATIAL_DELTA_50KM: 50,
      SPATIAL_DELTA_100KM: 100,
      SPATIAL_DELTA_250KM: 250,
      SPATIAL_DELTA_500KM: 500,
      SPATIAL_DELTA_1000KM: 1000,
      SPATIAL_DELTA_2500KM: 2500,
      SPATIAL_DELTA_5000KM: 5000,
      SPATIAL_DELTA_10000KM: 10000,
      STAPLE_PIZZA_5: 5,
      STAPLE_PIZZA_10: 10,
      STAPLE_PIZZA_25: 25,
      STAPLE_TURKISH_5: 5,
      STAPLE_TURKISH_10: 10,
      STAPLE_TURKISH_25: 25,
      STAPLE_SUSHI_5: 5,
      STAPLE_SUSHI_10: 10,
      STAPLE_SUSHI_25: 25,
    };

    for (const ach of catalog) {
      if (unlockedIds.has(ach.id)) continue;

      const target = TARGET_MAP[ach.code] || 9999;
      const parts = ach.code.split('_');
      const category = parts[0];
      let shouldUnlock = false;

      // --- COUNT LOGIC ---
      if (category === 'COUNT') {
        const subject = parts[1];
        if (subject === 'REVIEW' && totalReviews >= target) shouldUnlock = true;
        if (subject === 'RESTAURANT' && uniqueRestaurants >= target)
          shouldUnlock = true;
        if (subject === 'CUISINETYPE' && cuisinesTried >= target)
          shouldUnlock = true;

        if (subject === 'EXP') {
          const rawType = parts[2].toUpperCase();
          let matchType = '';
          if (rawType.startsWith('EATIN')) matchType = 'eat-in';
          if (rawType.startsWith('TAKEAWAY')) matchType = 'takeaway';
          if (rawType.startsWith('ORDER')) matchType = 'order';

          const count = fullHistory.filter(
            (r) => r.metadata?.experience_type === matchType,
          ).length;
          if (count >= target) shouldUnlock = true;
        }
      }

      // --- STREAK LOGIC ---
      if (category === 'STREAK') {
        if (parts[1] === 'WEEK') {
          const visitWeeks = fullHistory
            .map((r) => {
              if (!r.visit_date) return null;
              return Math.floor(
                new Date(r.visit_date).getTime() / (7 * 24 * 60 * 60 * 1000),
              );
            })
            .filter((w): w is number => w !== null)
            .sort((a, b) => a - b);

          const uniqueWeeks = Array.from(new Set(visitWeeks));
          let longestStreak = 0;
          let currentStreak = 0;
          let lastWeek = -1;

          uniqueWeeks.forEach((w) => {
            if (lastWeek === -1 || w === lastWeek + 1) currentStreak++;
            else currentStreak = 1;
            longestStreak = Math.max(longestStreak, currentStreak);
            lastWeek = w;
          });

          if (longestStreak >= target) shouldUnlock = true;
        }
      }

      // --- SPATIAL LOGIC ---
      if (category === 'SPATIAL') {
        const subject = parts[1];

        if (subject === 'DELTA') {
          let maxDist = 0;
          for (let i = 0; i < fullHistory.length; i++) {
            for (let j = i + 1; j < fullHistory.length; j++) {
              const r1 = fullHistory[i].restaurant;
              const r2 = fullHistory[j].restaurant;
              if (r1?.latitude && r2?.latitude) {
                const dist = getDistanceKM(
                  r1.latitude,
                  r1.longitude,
                  r2.latitude,
                  r2.longitude,
                );
                if (dist > maxDist) maxDist = dist;
              }
            }
          }
          if (maxDist >= target) shouldUnlock = true;
        }

        if (subject === 'CLUSTER') {
          let maxCluster = 0;
          fullHistory.forEach((pivot) => {
            const cluster = fullHistory.filter((other) => {
              if (!pivot.restaurant || !other.restaurant) return false;
              const dist = getDistanceKM(
                pivot.restaurant.latitude,
                pivot.restaurant.longitude,
                other.restaurant.latitude,
                other.restaurant.longitude,
              );
              return dist <= 0.05; // 50 meters
            });
            maxCluster = Math.max(maxCluster, cluster.length);
          });
          if (maxCluster >= target) shouldUnlock = true;
        }
      }

      // --- STAPLE LOGIC ---
      if (category === 'STAPLE') {
        const cuisineMatchKey = parts[1].toLowerCase();
        const validKeywords = CUISINE_DICTIONARY[cuisineMatchKey] || [
          cuisineMatchKey,
        ];

        const count = fullHistory.filter((r) => {
          const restCuisine = r.restaurant?.cuisine?.toLowerCase() || '';
          return validKeywords.some((keyword) => restCuisine.includes(keyword));
        }).length;

        if (count >= target) shouldUnlock = true;
      }

      // --- EVENT TRIGGERS (Retroactive Scans) ---
      if (category === 'EVENT') {
        // Non-Review Events
        if (ach.code === 'EVENT_WISHLIST_ADD' && bookmarksCount > 0)
          shouldUnlock = true;
        if (ach.code === 'EVENT_GROUP_ENGAGE' && groupsCount > 0)
          shouldUnlock = true;
        if (ach.code === 'EVENT_SOCIAL_FRIEND' && friendsCount > 0)
          shouldUnlock = true;

        // Review-based Historical Events
        if (ach.code === 'EVENT_CRITIC_DETAILED') {
          if (fullHistory.some((r) => (r.review_text || '').length >= 25))
            shouldUnlock = true;
        }
        if (ach.code === 'EVENT_SCORE_MIN') {
          if (fullHistory.some((r) => Number(r.rating) === 1.0))
            shouldUnlock = true;
        }
        if (ach.code === 'EVENT_SCORE_MAX') {
          if (fullHistory.some((r) => Number(r.rating) === 5.0))
            shouldUnlock = true;
        }
        if (ach.code === 'EVENT_BUDGET_MIN') {
          if (fullHistory.some((r) => Number(r.metadata?.price_tier) === 1))
            shouldUnlock = true;
        }
        if (ach.code === 'EVENT_BUDGET_MAX') {
          if (fullHistory.some((r) => Number(r.metadata?.price_tier) === 4))
            shouldUnlock = true;
        }
        if (ach.code === 'EVENT_SOCIAL_TAGGER') {
          if (
            fullHistory.some(
              (r) =>
                r.metadata?.tagged_user_ids &&
                r.metadata.tagged_user_ids.length > 0,
            )
          )
            shouldUnlock = true;
        }

        // Contextual Events (Only unlock if this is a real review submission)
        if (
          payload.restaurant?.google_place_id !== 'sync_engine_fallback_pivot'
        ) {
          if (ach.code === 'EVENT_SOCIAL_MATCH') {
            const matchingScore = friendReviews.some(
              (fr: { rating: number }) => fr.rating === currentReview.rating,
            );
            if (matchingScore) shouldUnlock = true;
          }
          if (ach.code === 'EVENT_SOCIAL_FOLLOWHIGH') {
            const friendHighlyRated = friendReviews.some(
              (fr: { rating: number }) => fr.rating >= 4.5,
            );
            if (friendHighlyRated && currentReview.rating >= 4.5)
              shouldUnlock = true;
          }
          if (ach.code === 'EVENT_SOCIAL_FOLLOWLOW') {
            const friendLowRated = friendReviews.some(
              (fr: { rating: number }) => fr.rating < 2.0,
            );
            if (friendLowRated && currentReview.rating < 2.0)
              shouldUnlock = true;
          }
          if (ach.code === 'EVENT_RESTAURANT_FIRST') {
            if (totalGlobalReviews <= 1) shouldUnlock = true;
          }
        }
      }

      if (shouldUnlock) {
        unlockedAchievements.push(ach);
      }
    }

    if (unlockedAchievements.length > 0) {
      const inserts = unlockedAchievements.map((ach) => ({
        user_id: userId,
        achievement_id: ach.id,
      }));
      const { error: insertError } = await supabaseClient
        .from('user_achievements')
        .insert(inserts);

      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify(unlockedAchievements), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
