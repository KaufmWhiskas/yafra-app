import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import { Alert } from 'react-native';
import { fetchUserStats } from '../../../services/profileService';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});

const mockSignOut = jest.fn();
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    session: { user: { id: 'user_123', email: 'test@example.com' } },
    signOut: mockSignOut,
  }),
}));

jest.mock('../../../services/profileService', () => ({
  fetchUserStats: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.spyOn(Alert, 'alert');

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchUserStats as jest.Mock).mockResolvedValue({
      reviewCount: 5,
      bookmarkCount: 12,
    });
  });

  it('renders user email and aggregated stats on mount', async () => {
    const { findByText } = render(<ProfileScreen />);

    expect(await findByText('test@example.com')).toBeTruthy();
    expect(await findByText('5')).toBeTruthy();
    expect(await findByText('12')).toBeTruthy();
    expect(fetchUserStats).toHaveBeenCalledWith('user_123');
  });

  it('navigates to WantToVisitScreen when the Want-To-Visit button is pressed', async () => {
    const { findByText } = render(<ProfileScreen />);

    const wantToVisitBtn = await findByText('Want to Visit');
    fireEvent.press(wantToVisitBtn);

    expect(mockNavigate).toHaveBeenCalledWith('WantToVisitScreen');
  });

  it('calls signOut from AuthContext when the logout button is pressed', async () => {
    const { findByText, getByTestId } = render(<ProfileScreen />);

    await findByText('test@example.com');

    const logoutButton = getByTestId('logout-button');
    fireEvent.press(logoutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });
});
