import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from '../App';

jest.mock('react-native-maps', () => {
  //import won't work here jest moves it to the top which crashes it
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const MockMapView = (props) => (
    <View testID="mock-map">{props.children}</View>
  );
  const MockMarker = (props) => <View testID={props.testID} />;

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
  };
});

jest.mock('../src/services/supabase', () => ({
  getMockRestaurants: jest.fn(() =>
    Promise.resolve([
      {
        id: '1',
        name: 'Test Burger',
        cuisine: 'American',
        latitude: 49.465,
        longitude: 8.425,
      },
    ]),
  ),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' }),
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 49.46, longitude: 8.42 } }),
  ),
}));

describe('<App />', () => {
  it('renders the main tab navigator and initial screen', async () => {
    render(<App />);

    const mapToggleBtn = await screen.findByText('Map View');
    expect(mapToggleBtn).toBeTruthy();

    expect(screen.getByText('Map')).toBeTruthy();
    expect(screen.getByText('Wishlist')).toBeTruthy();
    expect(screen.getByText('Groups')).toBeTruthy();
    expect(screen.getByText('Profile')).toBeTruthy();
  });
});
