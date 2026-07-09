import {
  fetchRestaurantDetails,
  fetchRestaurants,
  fetchMapRestaurants,
  triggerIngest,
} from '../restaurantService';
import { supabase } from '../supabase';

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    functions: {
      invoke: jest.fn(),
    },
  },
}));

describe('Restaurant Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchRestaurants', () => {
    it('fetchRestaurants maps google_rating to rating and parses strings to numbers', async () => {
      const mockDbData = [
        {
          id: '1',
          name: 'Piccola Italia',
          google_rating: '4.6', // DB returns string
          app_rating: '3.4', // DB returns string
        },
      ];

      // Setup the mock chain to resolve with our fake DB data
      // Since .lte() is called twice, the first call must continue the chain,
      // and the second call must resolve the promise with our data.
      // @ts-expect-error: lte is a custom mock property not on the root client
      (supabase.lte as jest.Mock)
        .mockReturnValueOnce(supabase)
        .mockResolvedValueOnce({
          data: mockDbData,
          error: null,
        });

      const bbox = { minLat: 0, maxLat: 1, minLon: 0, maxLon: 1 };
      const result = await fetchRestaurants(bbox);

      // Assert the data was transformed correctly for the frontend
      expect(result[0].rating).toBe(4.6);
      expect(result[0].app_rating).toBe(3.4);
      // @ts-expect-error: We are explicitly testing that this stripped property does not leak
      expect(result[0].google_rating).toBeUndefined();
    });
  });
});

describe('fetchMapRestaurants Performance Optimization', () => {
  it('should fetch only lightweight restaurant details and visibility coordinates', async () => {
    const records = await fetchMapRestaurants(48.1351, 11.582, 0.1, 0.1, [
      'group-123',
    ]);

    expect(records).toBeDefined();
    if (records.length > 0) {
      // Validate core parameters exist
      expect(records[0]).toHaveProperty('id');
      expect(records[0]).toHaveProperty('name');
      expect(records[0]).toHaveProperty('latitude');
      expect(records[0]).toHaveProperty('longitude');

      // CRITICAL: Ensure heavy nested relationships are omitted from initial map fetch
      expect(records[0]).not.toHaveProperty('reviews');
    }
  });
});

describe('triggerIngest', () => {
  it('invokes the ingest-restaurants edge function with the correct bounding box', async () => {
    const bbox = { minLat: 47.3, minLon: 8.5, maxLat: 47.4, maxLon: 8.6 };
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { message: 'Scan complete' },
      error: null,
    });

    await triggerIngest(bbox);

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'ingest-restaurants',
      {
        body: { bbox },
      },
    );
  });

  it('throws an error if the edge function invocation fails', async () => {
    const bbox = { minLat: 47.3, minLon: 8.5, maxLat: 47.4, maxLon: 8.6 };
    const errorMessage = 'Function invocation failed';

    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error(errorMessage),
    });

    await expect(triggerIngest(bbox)).rejects.toThrow(errorMessage);
  });
});

describe('fetchRestaurantDetails', () => {
  it('fetches fresh details and merges with live review calculations', async () => {
    const mockFreshDetails = {
      name: 'Fresh Name',
      rating: 4.8,
      user_ratings_total: 150,
      opening_hours: ['Monday: 9-5'],
      price_level: 2,
    };
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: mockFreshDetails,
      error: null,
    });

    // Mock the chain for from('restaurants') -> maybeSingle() and from('reviews')
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'restaurants') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: '1',
              app_rating: 4.0,
              details: null,
              details_updated_at: null,
            },
            error: null,
          }),
          update: jest.fn().mockReturnThis(),
        };
      }
      if (table === 'reviews') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [{ rating: 5.0 }, { rating: 3.4 }], // 2 reviews, avg = 4.2
            error: null,
          }),
        };
      }
      return supabase; // Fallback
    });

    const result = await fetchRestaurantDetails('place_123');

    expect(result).toEqual({
      ...mockFreshDetails,
      id: '1',
      app_rating: 4.2,
      app_review_count: 2,
    });
  });
});
