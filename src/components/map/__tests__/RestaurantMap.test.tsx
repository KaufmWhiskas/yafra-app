import React from 'react';
import { render } from '@testing-library/react-native';
import RestaurantMap from '../RestaurantMap';
import { Restaurant } from '../../../types';

jest.mock('react-native-maps');

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('RestaurantMap', () => {
  const createMockRestaurant = (
    overrides: Partial<Restaurant> = {},
  ): Restaurant => ({
    id: 'default-id',
    name: 'Default Name',
    cuisine: 'default',
    latitude: 0,
    longitude: 0,
    ...overrides,
  });

  const mockRestaurants: Restaurant[] = [
    createMockRestaurant({
      id: '1',
      name: 'Pizza Palace',
      cuisine: 'pizza',
      app_rating: 4.8,
      latitude: 49.46,
      longitude: 8.42,
    }),
    createMockRestaurant({
      id: '2',
      name: 'New Sushi Place',
      cuisine: 'sushi',
      rating: undefined, // Unrated
      latitude: 49.47,
      longitude: 8.43,
    }),
  ];

  it('renders detailed markers when selected', () => {
    const zoomedInRegion = {
      latitude: 49.465,
      longitude: 8.425,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };

    const { getAllByText } = render(
      <RestaurantMap
        restaurants={mockRestaurants}
        region={zoomedInRegion}
        onRestaurantSelect={jest.fn()}
        selectedRestaurant={mockRestaurants[0]}
        onMapPress={jest.fn()}
      />,
    );

    // Verify that the rating text is rendered inside the selected animated marker
    expect(getAllByText('4.8')[0]).toBeTruthy();
  });

  it('renders correctly when unselected', () => {
    const zoomedOutRegion = {
      latitude: 49.46,
      longitude: 8.42,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };

    const { getAllByTestId } = render(
      <RestaurantMap
        restaurants={mockRestaurants}
        region={zoomedOutRegion}
        onRestaurantSelect={jest.fn()}
        selectedRestaurant={null}
        onMapPress={jest.fn()}
      />,
    );

    // Verify all markers are rendered (2 components per restaurant: visual layer + touch shield)
    expect(getAllByTestId('restaurant-marker').length).toBe(4);
  });
});
