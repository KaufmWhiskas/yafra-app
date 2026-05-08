import React from 'react';
import { render } from '@testing-library/react-native';
import RestaurantMap from '../RestaurantMap';
import { COLORS } from '../../../constants/theme';

// 1. Mock the native map
jest.mock('react-native-maps', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockMapView = (props: any) => (
    <View testID={props.testID || 'restaurant-map'} {...props} />
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockMarker = (props: any) => (
    <View testID="restaurant-marker" {...props} />
  );

  MockMapView.Marker = MockMarker;
  return { __esModule: true, default: MockMapView, Marker: MockMarker };
});

// 2. Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('RestaurantMap', () => {
  const mockRestaurants = [
    {
      id: '1',
      name: 'Pizza Palace',
      cuisine: 'pizza',
      app_rating: 4.8,
      latitude: 49.46,
      longitude: 8.42,
    },
    {
      id: '2',
      name: 'New Sushi Place',
      cuisine: 'sushi',
      rating: undefined, // Unrated
      latitude: 49.47,
      longitude: 8.43,
    },
  ];

  it('renders detailed markers (decimals & icons) when zoomed IN', () => {
    const zoomedInRegion = {
      latitude: 49.46,
      longitude: 8.42,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    const { getByText } = render(
      <RestaurantMap
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        restaurants={mockRestaurants as any}
        region={zoomedInRegion}
        onRestaurantSelect={jest.fn()}
        selectedRestaurant={null}
        onMapPress={jest.fn()}
      />,
    );

    // Expect exact decimal
    expect(getByText(/4\.8/)).toBeTruthy();
    // Expect the "-" text for unrated places
    expect(getByText(/-/)).toBeTruthy();
  });

  it('renders compact markers (rounded numbers, no text) when zoomed OUT', () => {
    const zoomedOutRegion = {
      latitude: 49.46,
      longitude: 8.42,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };

    const { queryByText, getByText } = render(
      <RestaurantMap
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        restaurants={mockRestaurants as any}
        region={zoomedOutRegion}
        onRestaurantSelect={jest.fn()}
        selectedRestaurant={null}
        onMapPress={jest.fn()}
      />,
    );

    // Expect rounded integer (4.8 rounds up to 5)
    expect(getByText('5')).toBeTruthy();
    // Ensure the decimal version is NOT there
    expect(queryByText(/4\.8/)).toBeNull();
    // Ensure the word "New" is hidden completely
    expect(queryByText(/New/)).toBeNull();
  });

  it('updates marker color dynamically when bookmark status changes', () => {
    const mockRegion = {
      latitude: 49.46,
      longitude: 8.42,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };

    const { getAllByTestId, rerender } = render(
      <RestaurantMap
        bookmarkedIds={new Set()} // Start unbookmarked
        onToggleBookmark={jest.fn()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        restaurants={mockRestaurants as any}
        region={mockRegion}
        onRestaurantSelect={jest.fn()}
        selectedRestaurant={null}
        onMapPress={jest.fn()}
      />,
    );

    let markerViews = getAllByTestId('marker-inner-view');

    // 1. Assert initial state (App Rating is 4.8, so it should be Green initially)
    expect(markerViews[0].props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#4CAF50' }),
      ]),
    );

    // 2. Re-render with the bookmark added
    rerender(
      <RestaurantMap
        bookmarkedIds={new Set(['1'])} // Update state
        onToggleBookmark={jest.fn()}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        restaurants={mockRestaurants as any}
        region={mockRegion}
        onRestaurantSelect={jest.fn()}
        selectedRestaurant={null}
        onMapPress={jest.fn()}
      />,
    );

    markerViews = getAllByTestId('marker-inner-view');

    // 3. Assert it changed to the vibrant pink
    expect(markerViews[0].props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: COLORS.bookmark }),
      ]),
    );
  });
});
