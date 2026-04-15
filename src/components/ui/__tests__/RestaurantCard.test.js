import React from 'react';
import { render } from '@testing-library/react-native';
import RestaurantCard from '../RestaurantCard';

describe('RestaurantCard', () => {
  it('renders restaurant name and cuisine correctly', () => {
    const mockRestaurant = {
      id: 1,
      name: 'Burger King',
      cuisine: 'Fast Food',
      rating: 4.5,
    };

    const { getByText } = render(<RestaurantCard restaurantItem={mockRestaurant} />);

    expect(getByText('Burger King')).toBeTruthy();
    expect(getByText('Fast Food')).toBeTruthy();
  });
});
