import React from 'react';
import { render } from '@testing-library/react-native';
import RestaurantMap from '../RestaurantMap';
import { COLORS } from '../../../constants/theme';

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

  it('renders detailed markers when selected', () => {
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
        selectedRestaurant={mockRestaurants[0] as any}
        onMapPress={jest.fn()}
      />,
    );

    expect(getByText(/4\.8/)).toBeTruthy();
  });

  it('renders compact markers when unselected', () => {
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

    expect(getByText('5')).toBeTruthy();
    expect(queryByText(/4\.8/)).toBeNull();
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
        bookmarkedIds={new Set()}
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

    expect(markerViews[0].props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#4CAF50' }),
      ]),
    );

    rerender(
      <RestaurantMap
        bookmarkedIds={new Set(['1'])}
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

    expect(markerViews[0].props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: COLORS.bookmark }),
      ]),
    );
  });

  it('maintains deterministic marker order in the component tree when a restaurant is selected', () => {
    const mockRegion = {
      latitude: 49.46,
      longitude: 8.42,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };

    // 1. Render the map with selectedRestaurant={null}.
    const { getAllByTestId, rerender } = render(
      <RestaurantMap
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        restaurants={mockRestaurants as any}
        region={mockRegion}
        onRestaurantSelect={jest.fn()}
        selectedRestaurant={null}
        onMapPress={jest.fn()}
      />
    );

    // 2. Query all markers by testID.
    let markers = getAllByTestId(/^marker-\d+/);

    // 3. Extract and store the sequence of restaurant IDs from the initial render.
    const initialIds = markers.map((m) => m.props.testID);

    // 4. Re-render the map with a selectedRestaurant.
    rerender(
      <RestaurantMap
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        restaurants={mockRestaurants as any}
        region={mockRegion}
        onRestaurantSelect={jest.fn()}
        selectedRestaurant={mockRestaurants[0] as any}
        onMapPress={jest.fn()}
      />
    );

    // 5. Query the markers again.
    markers = getAllByTestId(/^marker-\d+/);
    const newIds = markers.map((m) => m.props.testID);

    // 6. Assert that the new sequence of IDs strictly matches the initial sequence.
    expect(newIds).toEqual(initialIds);
  });
});
