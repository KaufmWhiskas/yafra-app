import { supabase } from '../supabase';
import { processReviewAchievements } from '../achievementService';
import { Achievement, UserAchievement } from '../../types/achievements';

jest.mock('../supabase');

const mockedSupabase = supabase as jest.Mocked<typeof supabase>;

const mockCatalog: Achievement[] = [
  {
    id: '1',
    code: 'COUNT_REVIEW_1',
    title: 'First!',
    description: '',
    is_secret: false,
    secret_description: null,
    icon_name: 'star',
    target: 1,
  },
  {
    id: '2',
    code: 'COUNT_REVIEW_5',
    title: 'Five!',
    description: '',
    is_secret: false,
    secret_description: null,
    icon_name: 'star',
    target: 5,
  },
  {
    id: '3',
    code: 'COUNT_RESTAURANT_1',
    title: 'Explorer!',
    description: '',
    is_secret: false,
    secret_description: null,
    icon_name: 'map',
    target: 1,
  },
  {
    id: '4',
    code: 'EVENT_CRITIC_DETAILED',
    title: 'Critic!',
    description: '',
    is_secret: false,
    secret_description: null,
    icon_name: 'pencil',
    target: 1,
  },
];

describe('achievementService › processReviewAchievements', () => {
  let insertMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    insertMock = jest.fn().mockResolvedValue({ error: null });
  });

  const setupMocks = (
    existingAchievements: UserAchievement[],
    existingReviews: { restaurant_id: string }[],
  ) => {
    (mockedSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'achievements_catalog') {
        return {
          select: jest
            .fn()
            .mockResolvedValue({ data: mockCatalog, error: null }),
        };
      }
      if (table === 'user_achievements') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest
            .fn()
            .mockResolvedValue({ data: existingAchievements, error: null }),
          insert: insertMock,
        };
      }
      if (table === 'reviews') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest
            .fn()
            .mockResolvedValue({ data: existingReviews, error: null }),
        };
      }
      return { from: jest.fn().mockReturnThis() };
    });
  };

  it('unlocks first review and first restaurant achievements for a new user', async () => {
    setupMocks([], []);
    const userId = 'new_user';
    const reviewPayload = { restaurantId: 'rest_1', description: 'short' };

    await processReviewAchievements(reviewPayload, userId);

    expect(insertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: userId,
          achievement_id: '1',
        }),
        expect.objectContaining({
          user_id: userId,
          achievement_id: '3',
        }),
      ]),
    );
    expect(insertMock.mock.calls[0][0].length).toBe(2);
  });

  it('unlocks detailed critic achievement for a long review', async () => {
    setupMocks([], []);
    const userId = 'user_1';
    const reviewPayload = {
      restaurantId: 'rest_1',
      description: 'This is a very long and detailed review of the restaurant.',
    };

    const result = await processReviewAchievements(reviewPayload, userId);

    expect(insertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ achievement_id: '4' }),
      ]),
    );
    expect(result.some((a) => a.code === 'EVENT_CRITIC_DETAILED')).toBe(true);
  });

  it('skips achievements that are already unlocked', async () => {
    const existingAchievements: UserAchievement[] = [
      {
        id: 'ua1',
        user_id: 'veteran_user',
        achievement_id: '1',
        unlocked_at: '',
      },
      {
        id: 'ua2',
        user_id: 'veteran_user',
        achievement_id: '3',
        unlocked_at: '',
      },
    ];
    setupMocks(existingAchievements, [{ restaurant_id: 'rest_1' }]);
    const userId = 'veteran_user';
    const reviewPayload = {
      restaurantId: 'rest_2',
      description: 'Another one',
    };

    await processReviewAchievements(reviewPayload, userId);

    expect(insertMock).not.toHaveBeenCalled();
  });

  it('increments review count but not restaurant count for a repeat visit', async () => {
    const existingAchievements: UserAchievement[] = [
      {
        id: 'ua1',
        user_id: 'user_2',
        achievement_id: '1',
        unlocked_at: '',
      },
      {
        id: 'ua3',
        user_id: 'user_2',
        achievement_id: '3',
        unlocked_at: '',
      },
    ];
    const existingReviews = [
      { restaurant_id: 'rest_1' },
      { restaurant_id: 'rest_2' },
      { restaurant_id: 'rest_3' },
      { restaurant_id: 'rest_4' },
    ];
    setupMocks(existingAchievements, existingReviews);
    const userId = 'user_2';
    const reviewPayload = { restaurantId: 'rest_1', description: 'Revisiting' };

    await processReviewAchievements(reviewPayload, userId);

    // The user has 4 previous reviews, this is the 5th.
    // The restaurant is a repeat, so unique count is still 4.
    expect(insertMock).toHaveBeenCalledWith([
      expect.objectContaining({ achievement_id: '2' }),
    ]);
    expect(insertMock.mock.calls[0][0].length).toBe(1);
  });
});
