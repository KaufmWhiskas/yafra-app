import React from 'react';
import { render, act } from '@testing-library/react-native';
import RestaurantMap from '../RestaurantMap';
import { Restaurant } from '../../../types';

jest.mock('react-native-maps');

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome5: 'FontAwesome5',
  FontAwesome6: 'FontAwesome6',
}));
jest.mock('@react-native-vector-icons/lucide', () => 'Lucide');

jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn().mockReturnValue(true),
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
      latitude: 49.461,
      longitude: 8.421,
    }),
  ];

  beforeAll(() => {
    jest.useFakeTimers();
    // Safely stub requestAnimationFrame for the test environment
    jest
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        return setTimeout(() => cb(Date.now()), 16) as unknown as number;
      });
    jest
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation((id: number) => {
        clearTimeout(id);
      });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('renders detailed markers when selected', async () => {
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

    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(getAllByText('4.8')[0]).toBeTruthy();
  });

  it('renders correctly when unselected', async () => {
    const zoomedInRegion = {
      latitude: 49.46,
      longitude: 8.42,
      latitudeDelta: 0.004, // Zoomed IN
      longitudeDelta: 0.004,
    };

    const { getAllByTestId } = render(
      <RestaurantMap
        restaurants={mockRestaurants}
        region={zoomedInRegion}
        onRestaurantSelect={jest.fn()}
        selectedRestaurant={null}
        onMapPress={jest.fn()}
      />,
    );

    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(getAllByTestId('restaurant-marker').length).toBe(4);
  });
});
