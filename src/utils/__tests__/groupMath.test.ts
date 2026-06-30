import { calculateGroupAverage, calculateGroupMapScore } from '../groupMath';
import { GroupFeedReview, GroupMember, Review } from '../../types';

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
