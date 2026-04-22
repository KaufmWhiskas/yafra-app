import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MapScreen from '../MapScreen';
import { fetchRestaurants } from '../../../services/restaurantService';
import { requestForegroundPermissionsAsync } from 'expo-location';

const mockFetchRestaurants = jest.fn();

jest.mock('../../../services/restaurantService', () => ({
  fetchRestaurants: jest.fn(() =>
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

jest.mock('react-native-maps', () => {
  //import won't work here jest moves it to the top which crashes it
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const MockMapView = (props: {
    children?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <View testID="mock-map" onPress={props.onPress}>
      {props.children}
    </View>
  );
  const MockMarker = (props: { testID?: string; onPress?: () => void }) => (
    <View testID={props.testID} onPress={props.onPress} />
  );

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
  };
});

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' }),
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 49.46, longitude: 8.42 } }),
  ),
}));

describe('MapScreen Toggle Feature', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    jest.clearAllMocks();
  });

  it('calls fetchRestaurants when the component mounts', async () => {
    render(<MapScreen />);

    await waitFor(() => {
      expect(fetchRestaurants).toHaveBeenCalled();
    });
  });

  it('renders the map by default after loading', async () => {
    const { findByText, getByTestId } = render(<MapScreen />);

    // Wait for the UI to finish loading by looking for our toggle text
    await findByText('Map View');

    // Now synchronously check that the map is on the screen
    const mapElement = getByTestId('mock-map');
    expect(mapElement).toBeTruthy();
  });

  it('toggles between Map and List view when buttons are pressed', async () => {
    const { findByText, getByTestId, queryByTestId } = render(<MapScreen />);

    const listToggleButton = await findByText('List View');
    fireEvent.press(listToggleButton);

    expect(queryByTestId('mock-map')).toBeNull();
    expect(getByTestId('list-view')).toBeTruthy();

    const mapToggleButton = await findByText('Map View');
    fireEvent.press(mapToggleButton);

    expect(getByTestId('mock-map')).toBeTruthy();
    expect(queryByTestId('list-view')).toBeNull();
  });

  it('renders markers on the map for each restaurant from fetchRestaurants', async () => {
    const { getByText, getAllByTestId } = render(<MapScreen />);

    await waitFor(() => expect(getByText('Map View')).toBeTruthy());

    // Verify fetchRestaurants was called and markers are rendered based on returned data
    expect(fetchRestaurants).toHaveBeenCalled();
    const markers = getAllByTestId('restaurant-marker');
    expect(markers.length).toBeGreaterThan(0);
  });

  it('requests location permissions', async () => {
    render(<MapScreen />);

    await waitFor(() => {
      expect(requestForegroundPermissionsAsync).toHaveBeenCalled();
    });
  });

  it('floating ui card appears on press', async () => {
    const { getByText, getByTestId, queryByTestId } = render(<MapScreen />);

    await waitFor(() => expect(getByText('Map View')).toBeTruthy());

    const marker = getByTestId('restaurant-marker');
    fireEvent.press(marker);

    const floatingCard = getByTestId('floating-preview-card');
    expect(floatingCard).toBeTruthy();

    const map = getByTestId('mock-map');
    fireEvent.press(map);

    expect(queryByTestId('floating-preview-card')).toBeNull();
  });

  it('navigates to ReviewScreen when Add Review button is pressed', async () => {
    const { getByText, getByTestId } = render(<MapScreen />);

    await waitFor(() => expect(getByText('Map View')).toBeTruthy());

    const marker = getByTestId('restaurant-marker');
    fireEvent.press(marker);

    const reviewButton = getByText('Add Review');
    fireEvent.press(reviewButton);

    expect(mockNavigate).toHaveBeenCalledWith('ReviewScreen', {
      restaurant: expect.objectContaining({
        id: '1',
        name: 'Test Burger',
      }),
    });
  });
});
