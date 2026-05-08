import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RestaurantCard from '../RestaurantCard';

describe('RestaurantCard', () => {
  it('renders restaurant name and cuisine correctly', () => {
    const mockRestaurant = {
      id: 1,
      name: 'Burger King',
      cuisine: 'Fast Food',
      rating: 4.5,
      app_rating: 4.8,
      app_review_count: 12,
    };

    const { getByText } = render(<RestaurantCard item={mockRestaurant} />);

    expect(getByText('Burger King')).toBeTruthy();
    expect(getByText('Fast Food')).toBeTruthy();
  });
});

describe('RestaurantCard Interaction', () => {
  it('calls onPressReview when the Add Review button is pressed', () => {
    const mockOnPress = jest.fn();

    const mockRestaurant = {
      id: '1',
      name: 'Test Kitchen',
      cuisine: 'Modern',
      rating: 4.5,
      app_rating: 4.0,
      app_review_count: 5,
    };

    const { getByText } = render(
      <RestaurantCard item={mockRestaurant} onPressReview={mockOnPress} />,
    );

    const reviewButton = getByText('Add Review');
    fireEvent.press(reviewButton);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders app rating and review count when available', () => {
    const mockRestaurant = {
      id: 2,
      name: 'Pizzeria Uno',
      cuisine: 'Italian',
      latitude: 0,
      longitude: 0,
      app_rating: 4.8,
      app_review_count: 12,
    };

    const { getByText } = render(<RestaurantCard item={mockRestaurant} />);
    expect(getByText('4.8 ★ (12 App Reviews)')).toBeTruthy();
  });
});
