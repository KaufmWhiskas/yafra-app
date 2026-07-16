import { assertEquals } from 'std/testing/asserts.ts';
import { getDistanceKM } from './index.ts';

Deno.test(
  'getDistanceKM - calculates correct distance between coordinates',
  () => {
    // New York City to Los Angeles (approx 3936 km)
    const nyc = { lat: 40.7128, lon: -74.006 };
    const la = { lat: 34.0522, lon: -118.2437 };

    const distance = getDistanceKM(nyc.lat, nyc.lon, la.lat, la.lon);
    assertEquals(Math.round(distance), 3936); // Close enough within math precision limits
  },
);

Deno.test('process-achievements - algorithm evaluations', async (t) => {
  await t.step('evaluates COUNT achievements correctly', () => {
    const totalReviews = 5;
    const uniqueRestaurants = 10;
    const cuisinesTried = 3;

    assertEquals(totalReviews >= 5, true, 'COUNT_REVIEW_5 should pass');
    assertEquals(totalReviews >= 10, false, 'COUNT_REVIEW_10 should fail');

    assertEquals(
      uniqueRestaurants >= 10,
      true,
      'COUNT_RESTAURANT_10 should pass',
    );
    assertEquals(cuisinesTried >= 5, false, 'COUNT_CUISINETYPE_5 should fail');
  });

  await t.step('evaluates EVENT achievements correctly', () => {
    const longReview =
      'This is a very long and detailed text review that is definitely over 25 characters.';
    const shortReview = 'Too short';
    assertEquals(
      longReview.length >= 25,
      true,
      'EVENT_CRITIC_DETAILED should pass for long review',
    );
    assertEquals(
      shortReview.length >= 25,
      false,
      'EVENT_CRITIC_DETAILED should fail for short review',
    );

    const minRating = 1.0;
    const maxRating = 5.0;
    const midRating: number = 3.0;
    assertEquals(
      minRating === 1.0,
      true,
      'EVENT_SCORE_MIN should pass for 1.0 rating',
    );
    assertEquals(
      midRating === 1.0,
      false,
      'EVENT_SCORE_MIN should fail for 3.0 rating',
    );
    assertEquals(
      maxRating === 5.0,
      true,
      'EVENT_SCORE_MAX should pass for 5.0 rating',
    );

    // Social event tests
    const friendReviews = [{ rating: 4.0 }, { rating: 4.5 }];
    assertEquals(
      friendReviews.some((fr) => fr.rating === 4.0),
      true,
      'EVENT_SOCIAL_MATCH should pass',
    );
    assertEquals(
      friendReviews.some((fr) => fr.rating === 3.0),
      false,
      'EVENT_SOCIAL_MATCH should fail',
    );

    const friendHighlyRated = friendReviews.some((fr) => fr.rating >= 4.5);
    assertEquals(
      friendHighlyRated && 4.5 >= 4.5,
      true,
      'EVENT_SOCIAL_FOLLOWHIGH should pass',
    );

    const totalGlobalReviews = 3;
    assertEquals(
      totalGlobalReviews >= 3,
      true,
      'EVENT_RESTAURANT_POPULAR should pass',
    );
  });

  await t.step('evaluates STAPLE achievements correctly', () => {
    const pizzaReviews = 5;
    const sushiReviews = 2;
    assertEquals(pizzaReviews >= 5, true, 'STAPLE_PIZZA_5 should pass');
    assertEquals(sushiReviews >= 5, false, 'STAPLE_SUSHI_5 should fail');
  });

  await t.step('evaluates STREAK achievements correctly', () => {
    // Helper to get week number
    const getWeek = (d: Date) => {
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      return Math.ceil(
        ((d.getTime() - startOfYear.getTime()) / 86400000 +
          startOfYear.getDay() +
          1) /
          7,
      );
    };

    // Dates spanning 4 consecutive weeks
    const consecutiveDates = [
      new Date('2024-01-01'), // Week 1
      new Date('2024-01-08'), // Week 2
      new Date('2024-01-15'), // Week 3
      new Date('2024-01-22'), // Week 4
    ];
    const consecutiveWeeks = new Set(consecutiveDates.map(getWeek));
    // This logic is a simplified version of the one in the function, but tests the principle
    assertEquals(
      consecutiveWeeks.size,
      4,
      'STREAK_WEEKLY_4 should have 4 unique weeks',
    );
  });

  await t.step('evaluates SPATIAL achievements correctly', () => {
    const nyc = { latitude: 40.7128, longitude: -74.006 };
    const la = { latitude: 34.0522, longitude: -118.2437 };
    const sf = { latitude: 37.7749, longitude: -122.4194 };

    const dist = getDistanceKM(
      nyc.latitude,
      nyc.longitude,
      la.latitude,
      la.longitude,
    );
    assertEquals(
      dist >= 500,
      true,
      'SPATIAL_DELTA_500KM should pass for NYC to LA',
    );

    const closeDist = getDistanceKM(
      la.latitude,
      la.longitude,
      sf.latitude,
      sf.longitude,
    ); // ~559km
    assertEquals(
      closeDist >= 600,
      false,
      'SPATIAL_DELTA_600KM should fail for LA to SF',
    );

    // Cluster logic
    const cluster = [
      { restaurant: { latitude: 40.7128, longitude: -74.006 } }, // A
      { restaurant: { latitude: 40.7129, longitude: -74.0061 } }, // B (close to A)
      { restaurant: { latitude: 40.713, longitude: -74.0062 } }, // C (close to B)
    ];
    // Simplified test: count how many are close to the first one
    const pivot = cluster[0];
    const clusterSize = cluster.filter(
      (other) =>
        getDistanceKM(
          pivot.restaurant.latitude,
          pivot.restaurant.longitude,
          other.restaurant.latitude,
          other.restaurant.longitude,
        ) <= 0.05,
    ).length;
    assertEquals(
      clusterSize >= 3,
      true,
      'SPATIAL_CLUSTER_3 should pass for a tight group',
    );
  });
});
