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

serve(async (req) => {
  // 1. Extract the Authorization header from the incoming client request
  const authHeader = req.headers.get('Authorization');

  // 2. Pass the header into the client so RLS knows EXACTLY who is making the request
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    },
  );

  const { payload, userId } = await req.json();

  try {
    // 1. Fetch Catalog, Unlocks, and ALL historical reviews with Restaurant Coordinates
    const [
      catalogRes,
      userUnlocksRes,
      reviewsRes,
      friendsReviewsRes,
      globalReviewsCountRes,
    ] = await Promise.all([
      supabaseClient.from('achievements_catalog').select('*'),
      supabaseClient.from('user_achievements').select('achievement_id'),
      supabaseClient
        .from('reviews')
        .select(
          `
        id, rating, review_text, created_at, visit_date, metadata,
        restaurant:restaurants(id, latitude, longitude, cuisine)
      `,
        )
        .eq('user_id', userId),
      // Fetch reviews of the current restaurant written by accepted friends
      supabaseClient
        .from('reviews')
        .select('user_id, rating')
        .eq('restaurant_id', payload.restaurant.id)
        .neq('user_id', userId), // Excluding self

      // Get total count of reviews for this restaurant
      supabaseClient
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', payload.restaurant.id),
    ]);

    const catalog = catalogRes.data || [];
    const unlockedIds = new Set(
      (userUnlocksRes.data || []).map((a) => a.achievement_id),
    );
    const history = reviewsRes.data || [];
    const friendReviews = friendsReviewsRes.data || [];
    const totalGlobalReviews = globalReviewsCountRes.count || 0;

    // Fix: If the client payload is missing internal database geometry columns,
    // fetch the true restaurant coordinates directly from Postgres to prevent NaN math errors.
    let currentRestaurantDetails = payload.restaurant;
    if (
      !currentRestaurantDetails?.latitude ||
      !currentRestaurantDetails?.cuisine
    ) {
      const { data: dbRest } = await supabaseClient
        .from('restaurants')
        .select('id, latitude, longitude, cuisine')
        .eq('id', payload.restaurantId || payload.restaurant?.id)
        .maybeSingle();
      if (dbRest) {
        currentRestaurantDetails = dbRest;
      }
    }

    const currentReview = {
      rating: payload.rating,
      review_text: payload.description || '',
      visit_date: payload.visitDate || new Date().toISOString(),
      metadata: {
        experience_type: payload.experienceType,
        tags: payload.tags,
        price_tier: payload.priceTier,
      },
      restaurant: currentRestaurantDetails,
    };

    const fullHistory = [...history, currentReview];
    const unlockedAchievements = [];

    const totalReviews = fullHistory.length;
    const uniqueRestaurants = new Set(fullHistory.map((r) => r.restaurant?.id))
      .size;
    const cuisinesTried = new Set(
      fullHistory.map((r) => r.restaurant?.cuisine).filter(Boolean),
    ).size;

    for (const ach of catalog) {
      if (unlockedIds.has(ach.id)) continue;

      const parts = ach.code.split('_');
      const category = parts[0];
      const target = ach.target;
      let shouldUnlock = false;

      // --- COUNT LOGIC ---
      if (category === 'COUNT') {
        const subject = parts[1];
        if (subject === 'REVIEW' && totalReviews >= target) shouldUnlock = true;
        if (subject === 'RESTAURANT' && uniqueRestaurants >= target)
          shouldUnlock = true;
        if (subject === 'CUISINETYPE' && cuisinesTried >= target)
          shouldUnlock = true;

        // Experience types FIX: Handles un-prefixed splits like COUNT_EXP_TAKEAWAY5 matching payload types
        if (subject === 'EXP') {
          const rawType = parts[2]; // E.g., "EATIN5" or "TAKEAWAY25"
          let matchType = 'eat-in';
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
        // FIX: Replaced simple division with accurate absolute epoch week mappings
        // to handle year transitions (Dec -> Jan) perfectly
        const visitWeeks = fullHistory
          .map((r) => {
            if (!r.visit_date) return null;
            const d = new Date(r.visit_date);
            // Calculate absolute weeks since epoch Unix timestamp
            return Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
          })
          .filter((w): w is number => w !== null)
          .sort((a, b) => a - b);

        const uniqueWeeks = Array.from(new Set(visitWeeks));
        let longestStreak = 0;
        let currentStreak = 0;
        let lastWeek = -1;

        uniqueWeeks.forEach((w) => {
          if (lastWeek === -1 || w === lastWeek + 1) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
          longestStreak = Math.max(longestStreak, currentStreak);
          lastWeek = w;
        });

        if (longestStreak >= target) shouldUnlock = true;
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
        const cuisine = parts[1].toLowerCase();
        const count = fullHistory.filter(
          (r) => r.restaurant?.cuisine?.toLowerCase() === cuisine,
        ).length;
        if (count >= target) shouldUnlock = true;
      }

      // --- EVENT SINGLE TRIGGERS ---
      if (category === 'EVENT') {
        if (
          ach.code === 'EVENT_CRITIC_DETAILED' &&
          currentReview.review_text.length >= 25
        )
          shouldUnlock = true;
        if (ach.code === 'EVENT_SCORE_MIN' && currentReview.rating === 1.0)
          shouldUnlock = true;
        if (ach.code === 'EVENT_SCORE_MAX' && currentReview.rating === 5.0)
          shouldUnlock = true;
        if (
          ach.code === 'EVENT_BUDGET_MIN' &&
          currentReview.metadata?.price_tier === 1
        )
          shouldUnlock = true;
        if (
          ach.code === 'EVENT_BUDGET_MAX' &&
          currentReview.metadata?.price_tier === 4
        )
          shouldUnlock = true;

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

        if (ach.code === 'EVENT_RESTAURANT_POPULAR') {
          if (totalGlobalReviews >= 3) shouldUnlock = true;
        }

        if (ach.code === 'EVENT_SOCIAL_TAGGER') {
          if (payload.taggedUserIds && payload.taggedUserIds.length > 0)
            shouldUnlock = true;
        }

        if (ach.code === 'EVENT_SOCIAL_FOLLOWLOW') {
          const friendLowRated = friendReviews.some(
            (fr: { rating: number }) => fr.rating < 2.0,
          );
          if (friendLowRated && currentReview.rating < 2.0) shouldUnlock = true;
        }

        if (ach.code === 'EVENT_RESTAURANT_FIRST') {
          if (totalGlobalReviews <= 1) shouldUnlock = true;
        }
      }

      if (shouldUnlock) {
        unlockedAchievements.push(ach);
      }
    }

    // 3. Persist newly unlocked rows in the database
    if (unlockedAchievements.length > 0) {
      const inserts = unlockedAchievements.map((ach) => ({
        user_id: userId,
        achievement_id: ach.id,
      }));
      const { error: insertError } = await supabaseClient
        .from('user_achievements')
        .insert(inserts);

      // Throw the error so the mobile app console catches and prints it!
      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify(unlockedAchievements), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
});
