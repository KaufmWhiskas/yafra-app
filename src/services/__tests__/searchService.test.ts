import { getPlacePredictions } from '../searchService';
import { supabase } from '../supabase';
import { SearchRequest } from '../../types';

jest.mock('../supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

describe('Search Service', () => {
  beforeEach(() => {
    (supabase.functions.invoke as jest.Mock).mockClear();
  });

  it('constructs the correct payload body when coordinates are provided', async () => {
    const searchRequest: SearchRequest = {
      query: 'coffee',
      latitude: 47.3769,
      longitude: 8.5417,
    };
    const sessionToken = 'test-token';

    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });

    await getPlacePredictions(searchRequest, sessionToken);

    expect(supabase.functions.invoke).toHaveBeenCalledWith('search-places', {
      body: {
        input: searchRequest.query,
        sessionToken,
        location: {
          latitude: searchRequest.latitude,
          longitude: searchRequest.longitude,
        },
      },
    });
  });

  it('safely omits the location from the payload when coordinates are not provided', async () => {
    const searchRequest: SearchRequest = {
      query: 'coffee',
    };
    const sessionToken = 'test-token';

    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });

    await getPlacePredictions(searchRequest, sessionToken);

    const expectedBody = {
      input: searchRequest.query,
      sessionToken,
    };

    expect(supabase.functions.invoke).toHaveBeenCalledWith('search-places', {
      body: expect.objectContaining(expectedBody),
    });

    const callBody = (supabase.functions.invoke as jest.Mock).mock.calls[0][1]
      .body;
    expect(callBody).not.toHaveProperty('location');
  });
});
