import React from 'react';
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react-native';
import App from '../App';

jest.mock('../src/hooks/useActiveGroupFilters', () => ({
  useActiveGroupFilters: () => ({
    activeGroupIds: [],
    isFilterLoading: false,
    toggleGroupFilter: jest.fn(),
  }),
}));

jest.spyOn(global, 'requestAnimationFrame').mockImplementation((cb) => cb());

// Tell Jest to use the clean __mocks__ file we created earlier
jest.mock('react-native-maps');

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 49.46, longitude: 8.42 },
  }),
  Accuracy: { Balanced: 3 },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

// Mock AuthContext without needing React inside the closure
jest.mock('../src/context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    session: { user: { id: 'test-user-123' } },
    isLoading: false,
  }),
}));

jest.mock('../src/services/restaurantService', () => ({
  fetchRestaurants: jest.fn().mockResolvedValue([
    {
      id: '1',
      name: 'Test Burger',
      cuisine: 'American',
      latitude: 49.465,
      longitude: 8.425,
    },
  ]),
  fetchRestaurantDetails: jest.fn().mockResolvedValue({}),
  triggerIngest: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/services/bookmarkService', () => ({
  getBookmarks: jest.fn().mockResolvedValue([]),
  toggleBookmark: jest.fn(),
  fetchUserBookmarkedRestaurantIds: jest.fn().mockResolvedValue(new Set()),
  fetchCollections: jest.fn().mockResolvedValue([]),
  fetchCollectionSummaries: jest.fn().mockResolvedValue([]),
  fetchRestaurantSavedCollectionIds: jest.fn().mockResolvedValue(new Set()),
  createCollection: jest.fn(),
  toggleBookmarkInCollection: jest.fn(),
}));

jest.mock('../src/services/groupService', () => ({
  fetchMyGroups: jest.fn().mockResolvedValue([]),
  fetchGroupReviewedRestaurantIds: jest.fn().mockResolvedValue(new Set()),
}));

jest.mock('../src/services/searchService', () => ({
  getPlacePredictions: jest.fn().mockResolvedValue([]),
}));

jest.mock('../src/services/profileService', () => ({
  fetchUserStats: jest.fn().mockResolvedValue({}),
}));

describe('<App />', () => {
  it('renders the main tab navigator and initial screen', async () => {
    render(<App />);

    const loading = screen.queryByText('Loading restaurants from database...');
    if (loading) {
      await waitForElementToBeRemoved(() =>
        screen.queryByText('Loading restaurants from database...'),
      );
    }

    const mapToggleBtn = await screen.findByText('Map View');
    expect(mapToggleBtn).toBeTruthy();

    expect(screen.getByText('Map')).toBeTruthy();
    expect(screen.getByText('Groups')).toBeTruthy();
    expect(screen.getByText('Profile')).toBeTruthy();
  });
});
