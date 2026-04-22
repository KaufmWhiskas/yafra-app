import { fetchRestaurants } from '../restaurantService';
import { supabase } from '../supabase';

const mockSelect = jest.fn();

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
    })),
  },
}));

describe('Restaurant Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchRestaurants', () => {
    it('fetches and returns a list of restaurants successfully', async () => {
      const mockRestaurants = [
        {
          id: '1',
          name: 'Pizza Palace',
          cuisine: 'Italian',
          rating: 4.5,
        },
        {
          id: '2',
          name: 'Sushi Spot',
          cuisine: 'Japanese',
          rating: 4.8,
        },
      ];

      mockSelect.mockResolvedValue({
        data: mockRestaurants,
        error: null,
      });

      const result = await fetchRestaurants();

      expect(supabase.from).toHaveBeenCalledWith('restaurants');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockRestaurants);
    });

    it('throws an error if the database query fails', async () => {
      const errorMessage = 'Database connection failed';

      mockSelect.mockResolvedValue({
        data: null,
        error: new Error(errorMessage),
      });

      await expect(fetchRestaurants()).rejects.toThrow(errorMessage);
    });
  });
});
