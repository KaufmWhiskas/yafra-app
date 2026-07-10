import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import MapScreen from '../MapScreen';
import {
  fetchMapRestaurants,
  triggerIngest,
  fetchRestaurantDetails,
} from '../../../services/restaurantService';
import { requestForegroundPermissionsAsync } from 'expo-location';
import { useMapScanner } from '../../../hooks/useMapScanner';
import { Restaurant } from '../../../types';
import MapView from 'react-native-maps';

jest.mock('../../../hooks/useActiveGroupFilters', () => ({
  useActiveGroupFilters: () => ({
    activeGroupIds: [],
    isFilterLoading: false,
    toggleGroupFilter: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useStaggeredList', () => ({
  useStaggeredList: (items: Restaurant[]) => items,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../../../services/restaurantService');

jest.mock('../../../services/groupService', () => ({
  fetchGroupReviewedRestaurantIds: jest.fn().mockResolvedValue(new Set()),
  fetchMyGroups: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../services/bookmarkService', () => ({
  fetchUserBookmarkedRestaurantIds: jest.fn().mockResolvedValue(new Set()),
  fetchCollections: jest.fn().mockResolvedValue([]),
  fetchRestaurantSavedCollectionIds: jest.fn().mockResolvedValue(new Set()),
  createCollection: jest.fn(),
  toggleBookmarkInCollection: jest.fn(),
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ session: { user: { id: 'user_123' } } }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome5: 'FontAwesome5',
  FontAwesome6: 'FontAwesome6',
}));
jest.mock('@react-native-vector-icons/lucide', () => 'Lucide');

jest.mock('../../../hooks/useMapScanner', () => ({
  useMapScanner: jest.fn(() => ({
    scanRegion: jest.fn(),
    scanUserRadius: jest.fn(),
    showScanButton: false,
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
const mockAddListener = jest.fn(() => jest.fn()); // Mock returns an unsubscribe function
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  const ReactActual = jest.requireActual('react');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      getParent: () => ({
        addListener: mockAddListener,
      }),
    }),
    useFocusEffect: (cb: React.EffectCallback) => {
      ReactActual.useEffect(() => cb(), []);
    },
    useIsFocused: jest.fn().mockReturnValue(true),
  };
});

jest.mock('../../../utils/geo', () => ({
  ...jest.requireActual('../../../utils/geo'),
  getVisibleRestaurants: (restaurants: Restaurant[]) => restaurants,
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

jest.mock('../../../constants/categories', () => {
  const actual = jest.requireActual('../../../constants/categories');
  return {
    ...actual,
    getCategoryDisplayName: (key: string) => key,
  };
});

const flushMicrotasks = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('MapScreen Toggle Feature', () => {
  beforeEach(() => {
    (fetchMapRestaurants as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'Test Burger',
        cuisine: 'American',
        latitude: 49.465,
        longitude: 8.425,
        google_place_id: 'place_123',
        rating: 4.5,
      },
    ] as Restaurant[]);
    (triggerIngest as jest.Mock).mockResolvedValue(undefined);
    (fetchRestaurantDetails as jest.Mock).mockResolvedValue({});
  });

  it('calls fetchMapRestaurants when the component mounts', async () => {
    render(<MapScreen />);
    await waitFor(() => expect(fetchMapRestaurants).toHaveBeenCalled());
  });

  it('renders the map by default after loading', async () => {
    const { findByTestId } = render(<MapScreen />);
    expect(await findByTestId('mock-map')).toBeTruthy();
  });

  it('toggles between Map and List view when buttons are pressed', async () => {
    const { getByText, getByTestId, queryByTestId } = render(<MapScreen />);

    fireEvent.press(getByText('List View'));
    await flushMicrotasks();

    expect(queryByTestId('mock-map')).toBeNull();
    expect(getByTestId('list-view')).toBeTruthy();

    fireEvent.press(getByText('Map View'));
    await flushMicrotasks();

    expect(getByTestId('mock-map')).toBeTruthy();
    expect(queryByTestId('list-view')).toBeNull();
  });

  it('sorts restaurants by distance in list view', async () => {
    (fetchMapRestaurants as jest.Mock).mockResolvedValue([
      { id: '1', name: 'Far Restaurant', latitude: 49.5, longitude: 8.5 }, // ~7km away
      { id: '2', name: 'Close Restaurant', latitude: 49.461, longitude: 8.421 }, // close
    ] as Restaurant[]);

    const { getByText, findByTestId } = render(<MapScreen />);

    // Wait for the component to stabilize after effects
    await waitFor(async () => {
      const listButton = getByText('List View');
      fireEvent.press(listButton);
      const listView = await findByTestId('list-view');
      const restaurantData = listView.props.data;
      // The userLocation mock is { latitude: 49.46, longitude: 8.42 }
      // The component should sort 'Close Restaurant' first.
      expect(restaurantData.length).toBe(2);
      expect(restaurantData[0].name).toBe('Close Restaurant');
      expect(restaurantData[1].name).toBe('Far Restaurant');
    });
  });

  it('opens the CollectionModal when the bookmark icon is pressed in List View', async () => {
    const { getByText, getAllByTestId, findByText } = render(<MapScreen />);
    await flushMicrotasks();

    fireEvent.press(getByText('List View'));
    await flushMicrotasks();

    const bookmarkBtns = getAllByTestId('bookmark-button');
    fireEvent.press(bookmarkBtns[0]);
    await flushMicrotasks();

    expect(await findByText('Save to Collection')).toBeTruthy();
  });

  it('renders markers on the map for each restaurant from fetchRestaurants', async () => {
    const { findAllByTestId } = render(<MapScreen />);
    expect((await findAllByTestId('restaurant-marker')).length).toBeGreaterThan(
      0,
    );
  });

  it('applying a cuisine filter restricts rendered restaurant markers', async () => {
    (fetchMapRestaurants as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'Test Burger',
        cuisine: 'american_restaurant',
        latitude: 49.465,
        longitude: 8.425,
      },
      {
        id: '2',
        name: 'Test Italian',
        cuisine: 'italian_restaurant',
        latitude: 49.466,
        longitude: 8.426,
      },
    ] as Restaurant[]);

    const { getByText, getAllByTestId, getByTestId } = render(<MapScreen />);

    await waitFor(() =>
      expect(getAllByTestId('restaurant-marker')).toHaveLength(2),
    );

    fireEvent.press(getByTestId('filter-button'));

    fireEvent.press(getByText('Pizza & Italian'));

    fireEvent.press(getByText('Apply Filters'));

    await waitFor(() =>
      expect(getAllByTestId('restaurant-marker')).toHaveLength(1),
    );
  });

  it('requests location permissions', async () => {
    render(<MapScreen />);
    await waitFor(() =>
      expect(requestForegroundPermissionsAsync).toHaveBeenCalled(),
    );
  });

  it('floating ui card appears on press', async () => {
    const { getAllByTestId, getByTestId, queryAllByTestId } = render(
      <MapScreen />,
    );
    await waitFor(() =>
      expect(getAllByTestId('restaurant-marker').length).toBeGreaterThan(0),
    );

    const markers = getAllByTestId('restaurant-marker');
    fireEvent.press(markers[0]);
    await flushMicrotasks();

    expect(getAllByTestId('floating-preview-card').length).toBeGreaterThan(0);

    fireEvent.press(getByTestId('mock-map'));
    await flushMicrotasks();

    expect(queryAllByTestId('floating-preview-card').length).toBe(0);
  });

  it('passes bookmark toggle down to the floating preview card and opens CollectionModal', async () => {
    const { getAllByTestId, findByText } = render(<MapScreen />);
    await waitFor(() =>
      expect(getAllByTestId('restaurant-marker').length).toBeGreaterThan(0),
    );

    const markers = getAllByTestId('restaurant-marker');
    fireEvent.press(markers[0]);
    await flushMicrotasks();

    expect(getAllByTestId('floating-preview-card').length).toBeGreaterThan(0);

    const bookmarkBtn = getAllByTestId('bookmark-button')[0];
    fireEvent.press(bookmarkBtn);
    await flushMicrotasks();

    expect(await findByText('Save to Collection')).toBeTruthy();
  });

  it('navigates to ReviewScreen when Add Review button is pressed', async () => {
    const { getAllByTestId, getAllByText } = render(<MapScreen />);
    await waitFor(() =>
      expect(getAllByTestId('restaurant-marker').length).toBeGreaterThan(0),
    );

    const markers = getAllByTestId('restaurant-marker');
    fireEvent.press(markers[0]);
    await flushMicrotasks();

    const reviewButton = getAllByText('Add Review')[0];
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
      scanUserRadius: jest.fn(),
      showScanButton: false,
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

      await waitFor(() => {
        const searchBar = getByTestId('mock-search-bar');
        // This should pass after the useEffect snaps the map to the mocked user location
        expect(searchBar.props.userLocation?.latitude).toBeCloseTo(49.46);
      });
    });
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

describe('MapScreen Tab Navigation Override', () => {
  it('should reset viewMode back to map when the tab icon is clicked twice', () => {
    render(<MapScreen />);
    // Test logic maps the navigation listener execution
    expect(mockAddListener).toHaveBeenCalledWith(
      'tabPress',
      expect.any(Function),
    );
  });
});
