import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MapScreen from '../MapScreen';
import {
  fetchRestaurants,
  fetchRestaurantDetails,
} from '../../../services/restaurantService';
import { requestForegroundPermissionsAsync } from 'expo-location';
import { toggleBookmark } from '../../../services/bookmarkService';
import { useMapScanner } from '../../../hooks/useMapScanner';

jest.mock('../../../services/restaurantService', () => ({
  fetchRestaurants: jest.fn(() =>
    Promise.resolve([
      {
        id: '1',
        name: 'Test Burger',
        cuisine: 'American',
        latitude: 49.465,
        longitude: 8.425,
        google_place_id: 'place_123',
        rating: 4.5, // Add rating to prevent accidental background fetches in standard tests
      },
    ]),
  ),
  triggerIngest: jest.fn(() => Promise.resolve()),
  fetchRestaurantDetails: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../../services/bookmarkService', () => ({
  toggleBookmark: jest.fn(),
  getBookmarks: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ session: { user: { id: 'user_123' } } }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('../../../hooks/useMapScanner', () => ({
  useMapScanner: jest.fn(() => ({
    scanRegion: jest.fn(),
  })),
}));

jest.mock('../../../components/ui/SearchBar', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');

  interface MockSearchBarProps {
    onPlaceSelect: (place: { placeId: string; description: string }) => void;
    userLocation?: { latitude: number; longitude: number };
  }

  return function MockSearchBar(props: MockSearchBarProps) {
    const MockView = View as React.ElementType;
    return (
      <MockView
        testID="mock-search-bar"
        onPlaceSelect={props.onPlaceSelect}
        userLocation={props.userLocation}
      />
    );
  };
});

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

jest.mock('react-native-maps', () => {
  //import won't work here jest moves it to the top which crashes it
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const MockMapView = (props: {
    children?: React.ReactNode;
    onPress?: () => void;
    onRegionChangeComplete?: (region: Region) => void;
    region?: Region;
  }) => (
    <View
      testID="mock-map"
      onPress={props.onPress}
      onRegionChangeComplete={props.onRegionChangeComplete}
      region={props.region}
    >
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
  const actualNav = jest.requireActual('@react-navigation/native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
    useFocusEffect: jest.fn((cb) => React.useEffect(cb, [])),
  };
});

jest.mock('../../../utils/geo', () => ({
  ...jest.requireActual('../../../utils/geo'),
  calculateDistance: jest.fn(),
}));

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
    const { getByText } = render(<MapScreen />);

    await waitFor(() => {
      expect(fetchRestaurants).toHaveBeenCalled();
    });

    await waitFor(() => expect(getByText('Map View')).toBeTruthy());
  });

  it('renders the map by default after loading', async () => {
    const { findByText, getByTestId } = render(<MapScreen />);

    await findByText('Map View');

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

  it('calls toggleBookmark when the bookmark icon is pressed in List View', async () => {
    const { findByText, getByText, getAllByTestId } = render(<MapScreen />);

    await waitFor(() => expect(getByText('Map View')).toBeTruthy());

    const listToggleButton = await findByText('List View');
    fireEvent.press(listToggleButton);

    const bookmarkButtons = getAllByTestId('bookmark-button');
    fireEvent.press(bookmarkButtons[0]);

    expect(toggleBookmark).toHaveBeenCalledWith('1', 'user_123');
  });

  it('renders markers on the map for each restaurant from fetchRestaurants', async () => {
    const { getByText, getAllByTestId } = render(<MapScreen />);

    await waitFor(() => expect(getByText('Map View')).toBeTruthy());

    // Wait for the markers to actually render before asserting
    await waitFor(() => {
      const markers = getAllByTestId('restaurant-marker');
      expect(markers.length).toBeGreaterThan(0);
    });
  });

  it('requests location permissions', async () => {
    const { getByText } = render(<MapScreen />);

    await waitFor(() => {
      expect(requestForegroundPermissionsAsync).toHaveBeenCalled();
    });

    await waitFor(() => expect(getByText('Map View')).toBeTruthy());
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

  it('quietly fetches details in the background if a selected restaurant has no rating', async () => {
    // Override the mock to return an UNRATED restaurant specifically for this test
    (fetchRestaurants as jest.Mock).mockResolvedValueOnce([
      {
        id: '1',
        name: 'Test Burger',
        cuisine: 'American',
        latitude: 49.465,
        longitude: 8.425,
        google_place_id: 'place_123',
      },
    ]);
    (fetchRestaurantDetails as jest.Mock).mockResolvedValue({
      rating: 4.8,
    });

    const { getByText, getByTestId, findByText } = render(<MapScreen />);
    await waitFor(() => expect(getByText('Map View')).toBeTruthy());

    const marker = getByTestId('restaurant-marker');
    fireEvent.press(marker);

    expect(getByTestId('floating-preview-card')).toBeTruthy();

    await waitFor(() => {
      expect(fetchRestaurantDetails).toHaveBeenCalledWith('place_123');
    });

    expect(await findByText(/4\.8/)).toBeTruthy();
  });

  it('passes toggleBookmark down to the floating preview card', async () => {
    const { getByText, getByTestId, findByTestId } = render(<MapScreen />);
    await waitFor(() => expect(getByText('Map View')).toBeTruthy());

    const marker = getByTestId('restaurant-marker');
    fireEvent.press(marker);

    expect(getByTestId('floating-preview-card')).toBeTruthy();

    expect(await findByTestId('bookmark-button')).toBeTruthy();
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

  it('calls scanRegion on map region change', async () => {
    // Setup the mock to track calls
    const mockScanRegion = jest.fn();
    (useMapScanner as jest.Mock).mockReturnValue({
      scanRegion: mockScanRegion,
    });

    const { getByTestId, findByText } = render(<MapScreen />);
    await findByText('Map View');

    const mapElement = getByTestId('mock-map');
    const dummyRegion = {
      latitude: 47.35,
      longitude: 8.55,
      latitudeDelta: 0.1,
      longitudeDelta: 0.2,
    };

    // Trigger the region change
    fireEvent(mapElement, 'regionChangeComplete', dummyRegion);

    // Verify the screen passed the region to the scanner hook
    expect(mockScanRegion).toHaveBeenCalledWith(dummyRegion);
  });

  describe('Search Integration', () => {
    it('renders the SearchBar component', async () => {
      const { getByTestId, getByText } = render(<MapScreen />);
      await waitFor(() => expect(getByText('Map View')).toBeTruthy());
      expect(getByTestId('mock-search-bar')).toBeTruthy();
    });

    it('passes the map region coordinates to SearchBar as userLocation', async () => {
      const { getByTestId, getByText } = render(<MapScreen />);
      await waitFor(() => expect(getByText('Map View')).toBeTruthy());

      const searchBar = getByTestId('mock-search-bar');

      expect(searchBar.props.userLocation).toEqual(
        expect.objectContaining({
          latitude: 49.469805794737454,
          longitude: 8.422159691397045,
        }),
      );
    });
  });
});
