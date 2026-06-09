import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import {
  logout,
  fetchUserProfile,
  updateUsername,
} from '../../../services/authService';
import { getBookmarks } from '../../../services/bookmarkService';
import { Alert } from 'react-native';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  const ReactActual = jest.requireActual('react');

  return {
    ...actualNav,
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (cb: React.EffectCallback) => {
      ReactActual.useEffect(() => cb(), []);
    },
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
  fetchUserProfile: jest.fn(),
  updateUsername: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.spyOn(Alert, 'alert');

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches and displays the user's current username on mount", async () => {
    (fetchUserProfile as jest.Mock).mockResolvedValueOnce({
      id: 'user_123',
      username: 'cooltester',
    });
    (getBookmarks as jest.Mock).mockResolvedValueOnce([]);

    const { findByDisplayValue } = render(<ProfileScreen />);

    expect(await findByDisplayValue('cooltester')).toBeTruthy();
    expect(fetchUserProfile).toHaveBeenCalledWith('user_123');
  });

  it('updates the username when the save button is pressed', async () => {
    (fetchUserProfile as jest.Mock).mockResolvedValueOnce({
      id: 'user_123',
      username: 'cooltester',
    });
    (getBookmarks as jest.Mock).mockResolvedValueOnce([]);
    (updateUsername as jest.Mock).mockResolvedValueOnce({});

    const { findByDisplayValue, getByText } = render(<ProfileScreen />);

    const input = await findByDisplayValue('cooltester');
    fireEvent.changeText(input, 'newtester');

    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => {
      expect(updateUsername).toHaveBeenCalledWith('user_123', 'newtester');
    });
  });

  it('shows an alert if the username is already taken', async () => {
    (fetchUserProfile as jest.Mock).mockResolvedValueOnce({
      id: 'user_123',
      username: 'cooltester',
    });
    (getBookmarks as jest.Mock).mockResolvedValueOnce([]);
    (updateUsername as jest.Mock).mockRejectedValueOnce({ code: '23505' });

    const { findByDisplayValue, getByText } = render(<ProfileScreen />);

    const input = await findByDisplayValue('cooltester');
    fireEvent.changeText(input, 'takenname');

    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('already in use'),
      );
    });
  });

  it('calls logout when the logout button is pressed', async () => {
    (fetchUserProfile as jest.Mock).mockResolvedValueOnce({
      id: 'user_123',
      username: 'cooltester',
    });
    (getBookmarks as jest.Mock).mockResolvedValueOnce([]);

    const { getByTestId, findByDisplayValue } = render(<ProfileScreen />);

    await findByDisplayValue('cooltester');

    const logoutButton = getByTestId('logout-button');
    fireEvent.press(logoutButton);

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
    });
  });

  it('fetches and displays bookmarked restaurants on mount', async () => {
    (fetchUserProfile as jest.Mock).mockResolvedValueOnce({
      id: 'user_123',
      username: 'cooltester',
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
