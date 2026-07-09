import {
  calculateGroupAverage,
  calculateGroupMapScore,
  calculateScoreDistribution,
} from '../groupMath';
import { GroupFeedReview, GroupMember, Restaurant, Review } from '../../types';

describe('Group Math Aggregation', () => {
  describe('calculateGroupAverage', () => {
    it('Calculates standard average when all member weights are 1.0', () => {
      const members: GroupMember[] = [
        {
          group_id: 'g1',
          user_id: 'u1',
          role: 'member',
          weight: 1.0,
          is_active_filter: true,
          joined_at: '',
        },
        {
          group_id: 'g1',
          user_id: 'u2',
          role: 'member',
          weight: 1.0,
          is_active_filter: true,
          joined_at: '',
        },
        {
          group_id: 'g1',
          user_id: 'u3',
          role: 'member',
          weight: 1.0,
          is_active_filter: true,
          joined_at: '',
        },
      ];
      const reviews: Review[] = [
        { id: 'r1', restaurant_id: 'rest1', user_id: 'u1', rating: 3.0 },
        { id: 'r2', restaurant_id: 'rest1', user_id: 'u2', rating: 4.0 },
        { id: 'r3', restaurant_id: 'rest1', user_id: 'u3', rating: 5.0 },
      ];

      const avg = calculateGroupAverage('rest1', members, reviews);
      expect(avg).toBe(4.0);
    });

    it('Calculates weighted average when member weights differ', () => {
      const members: GroupMember[] = [
        {
          group_id: 'g1',
          user_id: 'uA',
          role: 'member',
          weight: 2.0,
          is_active_filter: true,
          joined_at: '',
        },
        {
          group_id: 'g1',
          user_id: 'uB',
          role: 'member',
          weight: 0.5,
          is_active_filter: true,
          joined_at: '',
        },
        {
          group_id: 'g1',
          user_id: 'uC',
          role: 'member',
          weight: 0.0,
          is_active_filter: true,
          joined_at: '',
        },
      ];
      const reviews: Review[] = [
        { id: 'r1', restaurant_id: 'rest1', user_id: 'uA', rating: 5.0 },
        { id: 'r2', restaurant_id: 'rest1', user_id: 'uB', rating: 1.0 },
        { id: 'r3', restaurant_id: 'rest1', user_id: 'uC', rating: 1.0 },
      ];

      // Math Check: (5.0 * 2.0) + (1.0 * 0.5) / (2.0 + 0.5) = 10.5 / 2.5 = 4.2.
      const avg = calculateGroupAverage('rest1', members, reviews);
      expect(avg).toBe(4.2);
    });

    it('Ignores reviews from non-members', () => {
      const members: GroupMember[] = [
        {
          group_id: 'g1',
          user_id: 'u1',
          role: 'member',
          weight: 1.0,
          is_active_filter: true,
          joined_at: '',
        },
      ];
      const reviews: Review[] = [
        { id: 'r1', restaurant_id: 'rest1', user_id: 'u1', rating: 4.0 },
        { id: 'r2', restaurant_id: 'rest1', user_id: 'u2', rating: 1.0 }, // non-member
      ];

      const avg = calculateGroupAverage('rest1', members, reviews);
      expect(avg).toBe(4.0);
    });

    it('Returns null if no valid reviews are found', () => {
      const members: GroupMember[] = [
        {
          group_id: 'g1',
          user_id: 'u1',
          role: 'member',
          weight: 1.0,
          is_active_filter: true,
          joined_at: '',
        },
      ];
      const reviews: Review[] = [
        { id: 'r1', restaurant_id: 'rest2', user_id: 'u1', rating: 4.0 }, // different restaurant
      ];

      const avg = calculateGroupAverage('rest1', members, reviews);
      expect(avg).toBeNull();
    });
  });

  describe('Group Map Score Engine', () => {
    it('should return 0 if there are no group reviews available', () => {
      const activeGroupReviews: GroupFeedReview[] = [];
      const score = calculateGroupMapScore(activeGroupReviews);
      expect(score).toBe(0);
    });

    it('should correctly average raw scores across active group members', () => {
      const activeGroupReviews = [
        { rating: 4.5, user_id: 'user1' },
        { rating: 3.5, user_id: 'user2' },
      ] as GroupFeedReview[];

      const score = calculateGroupMapScore(activeGroupReviews);
      expect(score).toBe(4.0);
    });
  });
});

describe('calculateScoreDistribution', () => {
  it('should correctly bucket restaurants by app_rating or fallback to rating', () => {
    const restaurants: Partial<Restaurant>[] = [
      { app_rating: 5.0 },
      { app_rating: 4.8 }, // -> 5.0 bucket
      { app_rating: 4.6 }, // -> 4.5 bucket
      { app_rating: 4.5 },
      { app_rating: 4.4 }, // -> 4.5 bucket
      { app_rating: 3.9 }, // -> 4.0 bucket
      { app_rating: 2.1 }, // -> 2.0 bucket
      { app_rating: 2.3 }, // -> 2.5 bucket
      { rating: 4.2 }, // -> 4.0 bucket (fallback to google rating)
      { rating: 4.9 }, // -> 5.0 bucket
      {}, // no rating, should be ignored
    ];

    const distribution = calculateScoreDistribution(
      restaurants as Restaurant[],
    );
    const buckets = distribution.buckets;

    expect(buckets.find((b) => b.score === 5.0)?.count).toBe(3);
    expect(buckets.find((b) => b.score === 4.5)?.count).toBe(3);
    expect(buckets.find((b) => b.score === 4.0)?.count).toBe(2);
    expect(buckets.find((b) => b.score === 3.5)?.count).toBe(0);
    expect(buckets.find((b) => b.score === 3.0)?.count).toBe(0);
    expect(buckets.find((b) => b.score === 2.5)?.count).toBe(1);
    expect(buckets.find((b) => b.score === 2.0)?.count).toBe(1);
    expect(buckets.find((b) => b.score === 1.5)?.count).toBe(0);
    expect(buckets.find((b) => b.score === 1.0)?.count).toBe(0);
    expect(buckets.length).toBe(9);
  });

  it('should calculate correct percentage heights based on max count', () => {
    const restaurants: Partial<Restaurant>[] = [
      { app_rating: 5.0 },
      { app_rating: 5.0 },
      { app_rating: 5.0 },
      { app_rating: 5.0 }, // 4 in 5.0 bucket
      { app_rating: 4.5 },
      { app_rating: 4.5 }, // 2 in 4.5 bucket
      { app_rating: 4.0 }, // 1 in 4.0 bucket
    ];

    const distribution = calculateScoreDistribution(
      restaurants as Restaurant[],
    );
    const buckets = distribution.buckets;

    expect(distribution.maxCount).toBe(4);
    expect(buckets.find((b) => b.score === 5.0)?.percentage).toBe(100);
    expect(buckets.find((b) => b.score === 4.5)?.percentage).toBe(50);
    expect(buckets.find((b) => b.score === 4.0)?.percentage).toBe(25);
  });

  it('should return an empty array for empty restaurant input', () => {
    const distribution = calculateScoreDistribution([]);
    expect(distribution.buckets).toEqual([]);
    expect(distribution.maxCount).toBe(0);
  });

  it('should handle restaurants with undefined or null ratings gracefully', () => {
    const restaurants: Partial<Restaurant>[] = [
      { rating: undefined },
      {}, // `rating` is `number | undefined`, so we test with an empty object
    ];
    const distribution = calculateScoreDistribution(
      restaurants as Restaurant[],
    );
    expect(distribution.buckets).toEqual([]);
  });
});
