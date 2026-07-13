import { submitReview, updateReview } from '../reviewService';
import { supabase } from '../supabase';

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user_me' } },
        error: null,
      }),
    },
  },
}));

const mockedSupabase = supabase as jest.Mocked<typeof supabase> & {
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

describe('reviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitReview with tagged users', () => {
    it('should insert the review and then insert tagged users in a batch', async () => {
      const reviewPayload = {
        restaurantId: '1',
        rating: 5,
        priceScore: 4,
        experienceType: 'eat-in' as const,
        tags: ['great service'],
        description: 'Amazing!',
        visitDate: new Date().toISOString(),
        isPrivate: false,
        priceTier: 3,
        taggedUserIds: ['friend_1', 'friend_2'],
      };

      const mockReviewId = 'review_abc';
      // Mock the insert calls. Since `from()` is mocked with `mockReturnThis`,
      // we are mocking the same `insert` function for both calls. We need to
      // differentiate based on the payload.
      (mockedSupabase.insert as jest.Mock).mockImplementation((payload) => {
        // This is the review insert
        if (payload[0].restaurant_id) {
          return {
            select: () => ({
              single: () =>
                Promise.resolve({ data: { id: mockReviewId }, error: null }),
            }),
          };
        }
        // This is the review_tagged_users insert
        return Promise.resolve({ error: null });
      });

      await submitReview(reviewPayload);

      // 1. Check review insertion
      expect(mockedSupabase.from).toHaveBeenCalledWith('reviews');
      expect(mockedSupabase.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          rating: reviewPayload.rating,
          review_text: reviewPayload.description,
        }),
      ]);

      // 2. Check tagged users insertion
      expect(mockedSupabase.from).toHaveBeenCalledWith('review_tagged_users');
      expect(mockedSupabase.insert).toHaveBeenCalledWith([
        { review_id: mockReviewId, user_id: 'friend_1' },
        { review_id: mockReviewId, user_id: 'friend_2' },
      ]);
    });
  });

  describe('updateReview with tagged users', () => {
    it('should delete existing tagged users and insert the new ones', async () => {
      const reviewId = 'review_xyz';
      const reviewPayload = {
        rating: 4,
        priceScore: null,
        experienceType: 'takeaway' as const,
        tags: [],
        description: 'Pretty good.',
        taggedUserIds: ['friend_3'],
        priceTier: 2,
      };

      // Mock the review update
      (mockedSupabase.from('reviews').update as jest.Mock).mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      });

      // Mock the delete operation
      (
        mockedSupabase.from('review_tagged_users').delete as jest.Mock
      ).mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock the insert operation
      (
        mockedSupabase.from('review_tagged_users').insert as jest.Mock
      ).mockResolvedValue({
        error: null,
      });

      await updateReview(reviewId, reviewPayload);

      // 1. Check review update
      expect(mockedSupabase.from('reviews').update).toHaveBeenCalledWith(
        expect.objectContaining({ rating: reviewPayload.rating }),
      );

      // 2. Check deletion of old tags
      expect(
        mockedSupabase.from('review_tagged_users').delete,
      ).toHaveBeenCalled();
      expect(
        (mockedSupabase.from('review_tagged_users').delete as jest.Mock)().eq,
      ).toHaveBeenCalledWith('review_id', reviewId);

      // 3. Check insertion of new tags
      expect(
        mockedSupabase.from('review_tagged_users').insert,
      ).toHaveBeenCalledWith([{ review_id: reviewId, user_id: 'friend_3' }]);
    });
  });
});
