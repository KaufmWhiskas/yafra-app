import React from 'react';
import { render } from '@testing-library/react-native';
import RestaurantMap from '../RestaurantMap';
import { Restaurant } from '../../../types';

jest.mock('react-native-maps');

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('RestaurantMap', () => {
  const mockRestaurants: Restaurant[] = [
    {
      id: '1',
      name: 'Pizza Palace',
      cuisine: 'pizza',
      app_rating: 4.8,
      latitude: 49.46,
      longitude: 8.42,
    } as Restaurant,
    {
      id: '2',
      name: 'New Sushi Place',
      cuisine: 'sushi',
      rating: undefined, // Unrated
      latitude: 49.47,
      longitude: 8.43,
    } as Restaurant,
  ];

  it('renders detailed markers when selected', () => {
    const zoomedInRegion = {
      latitude: 49.46,
      longitude: 8.42,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
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
