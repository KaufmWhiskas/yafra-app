import React from 'react';
import { render } from '@testing-library/react-native';
import RestaurantCard from '../RestaurantCard';
import { Restaurant } from '../../../types';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('RestaurantCard UI', () => {
  it('verifies that the rating badge on the card applies solid styling for app reviews', () => {
    const item = {
      id: '1',
      name: 'App Place',
      cuisine: 'burger',
      latitude: 0,
      longitude: 0,
      app_rating: 4.8,
      app_review_count: 5,
    } as Restaurant;
    const { getByText, getByTestId } = render(<RestaurantCard item={item} />);

    expect(getByText('4.8')).toBeTruthy();
    expect(getByText('4.8 ★ (5 App Reviews)')).toBeTruthy();
    const badge = getByTestId('restaurant-badge');
    expect(badge.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: expect.not.stringMatching('#fff'),
        }),
      ]),
    );
  });

  it('verifies that if Google data is used, the component renders the total review count in hollow style', () => {
    const item = {
      id: '2',
      name: 'Google Place',
      cuisine: 'pizza',
      latitude: 0,
      longitude: 0,
      rating: 4.5,
      user_ratings_total: 128,
    };
    const { getByText, getByTestId } = render(
      <RestaurantCard item={item as unknown as Restaurant} />,
    );

    expect(getByText('4.5')).toBeTruthy();
    expect(getByText('4.5 ★ (128 Google Reviews)')).toBeTruthy();
    const badge = getByTestId('restaurant-badge');
    expect(badge.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#ffffff' }),
      ]),
    );
  });
});
