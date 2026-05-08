import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import { logout } from '../../../services/authService';
import { fetchUserProfile } from '../../../services/profileService';
import { getBookmarks } from '../../../services/bookmarkService';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    ...actualNav,
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: jest.fn((cb) => React.useEffect(cb, [])),
  };
});

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ session: { user: { id: 'user_123' } } }),
}));

jest.mock('../../../services/bookmarkService', () => ({
  getBookmarks: jest.fn().mockResolvedValue([]),
  toggleBookmark: jest.fn(),
}));

jest.mock('../../../services/authService', () => ({
  logout: jest.fn(),
}));

jest.mock('../../../services/profileService', () => ({
  fetchUserProfile: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and displays the user profile data on mount', async () => {
    (fetchUserProfile as jest.Mock).mockResolvedValueOnce({
      email: 'tester@yafra.com',
      reviewCount: 5,
    });
    // Add a mock for getBookmarks so it doesn't leave an unhandled promise
    (getBookmarks as jest.Mock).mockResolvedValueOnce([]);

    const { findByText } = render(<ProfileScreen />);

    expect(await findByText('tester@yafra.com')).toBeTruthy();
  });

  it('calls logout when the logout button is pressed', async () => {
    (fetchUserProfile as jest.Mock).mockResolvedValueOnce({
      email: 'tester@yafra.com',
      reviewCount: 5,
    });
    (getBookmarks as jest.Mock).mockResolvedValueOnce([]);

    const { getByTestId, findByText } = render(<ProfileScreen />);

    await findByText('tester@yafra.com');

    const logoutButton = getByTestId('logout-button');
    fireEvent.press(logoutButton);

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
    });
  });

  it('fetches and displays bookmarked restaurants on mount', async () => {
    (fetchUserProfile as jest.Mock).mockResolvedValueOnce({
      email: 'tester@yafra.com',
      reviewCount: 5,
    });
    (getBookmarks as jest.Mock).mockResolvedValueOnce([
      {
        id: 'rest_1',
        name: 'Saved Pizza',
        cuisine: 'pizza',
        latitude: 49.46,
        longitude: 8.42,
        rating: 4.5,
      },
    ]);

    const { findByText } = render(<ProfileScreen />);

    expect(await findByText('Saved Pizza')).toBeTruthy();

    expect(await findByText('My Saved Places')).toBeTruthy();
    expect(getBookmarks).toHaveBeenCalledWith('user_123');
  });
});
