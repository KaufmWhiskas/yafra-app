import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import RestaurantDetailScreen from '../RestaurantDetailScreen';
import { fetchRestaurantDetails } from '../../../services/restaurantService';

jest.mock('../../../services/restaurantService', () => ({
  fetchRestaurantDetails: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  return {
    useRoute: () => ({
      params: { restaurantId: 'place_123', restaurantName: 'Test Restaurant' },
    }),
  };
});

describe('RestaurantDetailScreen', () => {
  it('renders the restaurant name from params and calls fetchRestaurantDetails', async () => {
    (fetchRestaurantDetails as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'Test Restaurant',
      cuisine: 'American',
      latitude: 0,
      longitude: 0,
      user_ratings_total: 456,
      rating: 4.5,
      address: '123 Main St',
    });

    const { getByText } = render(<RestaurantDetailScreen />);

    expect(getByText('Test Restaurant')).toBeTruthy();

    await waitFor(() => {
      expect(fetchRestaurantDetails).toHaveBeenCalledWith('place_123');
    });
  });
});
