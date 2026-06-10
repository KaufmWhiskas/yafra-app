import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from '../App';

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
}));

jest.mock('../src/services/bookmarkService', () => ({
  getBookmarks: jest.fn().mockResolvedValue([]),
  toggleBookmark: jest.fn(),
  fetchUserBookmarkedRestaurantIds: jest.fn().mockResolvedValue(new Set()),
}));

describe('<App />', () => {
  it('renders the main tab navigator and initial screen', async () => {
    render(<App />);

    const mapToggleBtn = await screen.findByText('Map View');
    expect(mapToggleBtn).toBeTruthy();

    expect(screen.getByText('Map')).toBeTruthy();
    expect(screen.getByText('Groups')).toBeTruthy();
    expect(screen.getByText('Profile')).toBeTruthy();
  });
});
