import React from 'react';
import { render } from '@testing-library/react-native';
import RestaurantMap from '../RestaurantMap';

// 1. Mock react-native-maps so Jest doesn't crash on native views
jest.mock('react-native-maps', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockMapView = (props: any) => (
    <View testID={props.testID || 'map-view'} {...props} />
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockMarker = (props: any) => <View testID="map-marker" {...props} />;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockCallout = (props: any) => <View testID="map-callout" {...props} />;

  MockMapView.Marker = MockMarker;
  MockMapView.Callout = MockCallout;

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Callout: MockCallout,
  };
});

describe('RestaurantMap', () => {
  const mockRegion = {
    latitude: 49.46,
    longitude: 8.42,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

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
      name: 'Burger Joint',
      cuisine: 'hamburger',
      rating: 4.2, // Fallback to google rating
      latitude: 49.47,
      longitude: 8.43,
    },
  ];

  it('applies a customMapStyle to hide default Google POIs', () => {
    const { getByTestId } = render(
      <RestaurantMap
        restaurants={mockRestaurants as any}
        region={mockRegion}
        onRestaurantSelect={jest.fn()}
        selectedRestaurant={null}
        onMapPress={jest.fn()}
      />,
    );

    const map = getByTestId('restaurant-map');

    expect(map.props.customMapStyle).toBeDefined();

    // Check if the style array contains the rule to hide POIs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasPoiHidden = map.props.customMapStyle.some(
      (style: any) =>
        style.featureType === 'poi' && style.stylers[0].visibility === 'off',
    );
    expect(hasPoiHidden).toBe(true);
  });

  it('renders custom markers showing the rating', () => {
    const { getByText } = render(
      <RestaurantMap
        restaurants={mockRestaurants as any}
        region={mockRegion}
        onRestaurantSelect={jest.fn()}
        selectedRestaurant={null}
        onMapPress={jest.fn()}
      />,
    );

    // We expect our custom marker to render the ratings instead of a default pin
    expect(getByText(/4\.8/)).toBeTruthy();
    expect(getByText(/4\.2/)).toBeTruthy();
  });
});
