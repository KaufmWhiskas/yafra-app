import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import MapScreen from '../MapScreen';
import {
  fetchRestaurants,
  fetchRestaurantDetails,
} from '../../../services/restaurantService';
import { requestForegroundPermissionsAsync } from 'expo-location';
import { toggleBookmark } from '../../../services/bookmarkService';
import { useMapScanner } from '../../../hooks/useMapScanner';
import { Restaurant } from '../../../types';
import MapView from 'react-native-maps';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, left: 0, bottom: 0, right: 0 }),
}));

jest.mock('../../../services/restaurantService', () => ({
  fetchRestaurants: jest.fn().mockResolvedValue([
    {
      id: '1',
      name: 'Test Burger',
      cuisine: 'American',
      latitude: 49.465,
      longitude: 8.425,
      google_place_id: 'place_123',
      rating: 4.5,
    },
  ] as Restaurant[]),
  triggerIngest: jest.fn().mockResolvedValue(undefined),
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
  const ReactActual = jest.requireActual('react');
  return (props: Record<string, unknown>) =>
    ReactActual.createElement('View', { testID: 'mock-search-bar', ...props });
});

jest.mock('react-native-maps');

jest.mock('../../../components/map/RestaurantMarker', () => {
  const ReactActual = jest.requireActual('react');
  const { TouchableOpacity } = jest.requireActual('react-native');

  interface MockMarkerProps {
    onPress: (restaurant: Restaurant) => void;
    restaurant: Restaurant;
    children?: React.ReactNode;
  }

  return (props: MockMarkerProps) =>
    ReactActual.createElement(
      TouchableOpacity,
      {
        testID: 'restaurant-marker',
        onPress: () => props.onPress(props.restaurant),
      },
      props.children,
    );
});

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  const ReactActual = jest.requireActual('react');
  return {
    ...actualNav,
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (cb: React.EffectCallback) => {
      ReactActual.useEffect(cb, []);
    },
  };
});

jest.mock('../../../utils/geo', () => ({
  ...jest.requireActual('../../../utils/geo'),
  calculateDistance: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 49.46, longitude: 8.42 },
  }),
  getLastKnownPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 49.46, longitude: 8.42 },
  }),
  watchHeadingAsync: jest.fn().mockResolvedValue({
    remove: jest.fn(),
  }),
  Accuracy: { Balanced: 3 },
}));

const flushMicrotasks = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('MapScreen Toggle Feature', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & {
        requestAnimationFrame: typeof requestAnimationFrame;
      }
    ).requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    };
  });

  beforeEach(() => {
    mockNavigate.mockClear();
    jest.clearAllMocks();
  });

  it('calls fetchRestaurants when the component mounts', async () => {
    render(<MapScreen />);
    await flushMicrotasks();
    expect(fetchRestaurants).toHaveBeenCalled();
  });

  it('renders the map by default after loading', async () => {
    const { getByTestId } = render(<MapScreen />);
    await flushMicrotasks();
    expect(getByTestId('mock-map')).toBeTruthy();
  });

  it('toggles between Map and List view when buttons are pressed', async () => {
    const { getByText, getByTestId, queryByTestId } = render(<MapScreen />);
    await flushMicrotasks();

    fireEvent.press(getByText('List View'));
    await flushMicrotasks();

    expect(queryByTestId('mock-map')).toBeNull();
    expect(getByTestId('list-view')).toBeTruthy();

    fireEvent.press(getByText('Map View'));
    await flushMicrotasks();

    expect(getByTestId('mock-map')).toBeTruthy();
    expect(queryByTestId('list-view')).toBeNull();
  });

  it('calls toggleBookmark when the bookmark icon is pressed in List View', async () => {
    const { getByText, getAllByTestId } = render(<MapScreen />);
    await flushMicrotasks();

    fireEvent.press(getByText('List View'));
    await flushMicrotasks();

    const bookmarkBtns = getAllByTestId('bookmark-button');
    fireEvent.press(bookmarkBtns[0]);
    await flushMicrotasks();

    expect(toggleBookmark).toHaveBeenCalledWith('1', 'user_123');
  });

  it('renders markers on the map for each restaurant from fetchRestaurants', async () => {
    const { getAllByTestId } = render(<MapScreen />);
    await flushMicrotasks();
    await flushMicrotasks(); // Advance frame queues to allow stagger hooks to drain
    const markers = getAllByTestId('restaurant-marker');
    expect(markers.length).toBeGreaterThan(0);
  });

  it('requests location permissions', async () => {
    render(<MapScreen />);
    await flushMicrotasks();
    expect(requestForegroundPermissionsAsync).toHaveBeenCalled();
  });

  it('floating ui card appears on press', async () => {
    const { getAllByTestId, getByTestId, queryByTestId } = render(
      <MapScreen />,
    );
    await flushMicrotasks();
    await flushMicrotasks();

    const markers = getAllByTestId('restaurant-marker');
    fireEvent.press(markers[0]);
    await flushMicrotasks();

    expect(getByTestId('floating-preview-card')).toBeTruthy();

    fireEvent.press(getByTestId('mock-map'));
    await flushMicrotasks();

    expect(queryByTestId('floating-preview-card')).toBeNull();
  });

  it('quietly fetches details in the background if a selected restaurant has no rating', async () => {
    (fetchRestaurants as jest.Mock).mockResolvedValueOnce([
      {
        id: '1',
        name: 'Test Burger',
        cuisine: 'American',
        latitude: 49.465,
        longitude: 8.425,
        google_place_id: 'place_123',
      } as Restaurant,
    ]);
    (fetchRestaurantDetails as jest.Mock).mockResolvedValue({ rating: 4.8 });

    const { getAllByTestId, getByTestId, getAllByText } = render(<MapScreen />);
    await flushMicrotasks();
    await flushMicrotasks();

    const markers = getAllByTestId('restaurant-marker');
    fireEvent.press(markers[0]);
    await flushMicrotasks();

    expect(getByTestId('floating-preview-card')).toBeTruthy();
    expect(fetchRestaurantDetails).toHaveBeenCalledWith('place_123');

    const elements = getAllByText(/4\.8/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('passes toggleBookmark down to the floating preview card', async () => {
    const { getAllByTestId, getByTestId } = render(<MapScreen />);
    await flushMicrotasks();
    await flushMicrotasks();

    const markers = getAllByTestId('restaurant-marker');
    fireEvent.press(markers[0]);
    await flushMicrotasks();

    expect(getByTestId('floating-preview-card')).toBeTruthy();
    expect(getByTestId('bookmark-button')).toBeTruthy();
  });

  it('navigates to ReviewScreen when Add Review button is pressed', async () => {
    const { getAllByTestId, getByText } = render(<MapScreen />);
    await flushMicrotasks();
    await flushMicrotasks();

    const markers = getAllByTestId('restaurant-marker');
    fireEvent.press(markers[0]);
    await flushMicrotasks();

    const reviewButton = getByText('Add Review');
    fireEvent.press(reviewButton);
    await flushMicrotasks();

    expect(mockNavigate).toHaveBeenCalledWith(
      'ReviewScreen',
      expect.objectContaining({ restaurant: expect.anything() }),
    );
  });

  it('calls scanRegion on map region change', async () => {
    const mockScanRegion = jest.fn();
    (useMapScanner as jest.Mock).mockReturnValue({
      scanRegion: mockScanRegion,
    });

    const { getByTestId } = render(<MapScreen />);
    await flushMicrotasks();

    const mapElement = getByTestId('mock-map');
    const dummyRegion = {
      latitude: 47.35,
      longitude: 8.55,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };

    fireEvent(mapElement, 'regionChangeComplete', dummyRegion);
    await flushMicrotasks();

    expect(mockScanRegion).toHaveBeenCalledWith(dummyRegion);
  });

  describe('Search Integration', () => {
    it('renders the SearchBar component', async () => {
      const { getByTestId } = render(<MapScreen />);
      await flushMicrotasks();
      expect(getByTestId('mock-search-bar')).toBeTruthy();
    });

    it('passes the map region coordinates to SearchBar as userLocation', async () => {
      const { getByTestId } = render(<MapScreen />);
      await flushMicrotasks();

      const searchBar = getByTestId('mock-search-bar');
      expect(searchBar.props.userLocation).toEqual(
        expect.objectContaining({ latitude: 49.46 }),
      );
    });
  });

  it('does not call scanRegion when zoomed out past the maximum threshold', async () => {
    const mockScanRegion = jest.fn();
    (useMapScanner as jest.Mock).mockReturnValue({
      scanRegion: mockScanRegion,
    });

    const { getByTestId } = render(<MapScreen />);
    await flushMicrotasks();

    const mapElement = getByTestId('mock-map');
    const zoomedOutRegion = {
      latitude: 47.35,
      longitude: 8.55,
      latitudeDelta: 0.15,
      longitudeDelta: 0.15,
    };

    fireEvent(mapElement, 'regionChangeComplete', zoomedOutRegion);
    await flushMicrotasks();

    expect(mockScanRegion).not.toHaveBeenCalled();
  });

  describe('Custom Map Controls', () => {
    it('Pressing the custom "My Location" button calls mapRef.animateCamera with userLocation', async () => {
      const { getByTestId } = render(<MapScreen />);
      await flushMicrotasks();

      const animateCameraSpy = jest.spyOn(MapView.prototype, 'animateCamera');

      const myLocationButton = getByTestId('my-location-button');
      fireEvent.press(myLocationButton);

      expect(animateCameraSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          center: { latitude: 49.46, longitude: 8.42 },
          zoom: 15,
        }),
        expect.objectContaining({ duration: 500 }),
      );

      animateCameraSpy.mockRestore();
    });

    it('Pressing the custom "Compass" button calls mapRef.animateCamera with heading 0', async () => {
      const { getByTestId } = render(<MapScreen />);
      await flushMicrotasks();

      const animateCameraSpy = jest.spyOn(MapView.prototype, 'animateCamera');

      const compassButton = getByTestId('compass-button');
      fireEvent.press(compassButton);

      expect(animateCameraSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          heading: 0,
        }),
        expect.objectContaining({ duration: 400 }),
      );

      animateCameraSpy.mockRestore();
    });
  });
});
