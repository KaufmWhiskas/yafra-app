import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import { logout } from '../../../services/authService';
import { fetchUserProfile } from '../../../services/profileService';

jest.mock('../../../services/authService', () => ({
  logout: jest.fn(),
}));

jest.mock('../../../services/profileService', () => ({
  fetchUserProfile: jest.fn(),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and displays the user profile data on mount', async () => {
    // Mock the profile service to return a user with 5 reviews
    (fetchUserProfile as jest.Mock).mockResolvedValueOnce({
      email: 'tester@yafra.com',
      reviewCount: 5,
    });

    const { getByText, findByText } = render(<ProfileScreen />);

    // Assert loading state (optional depending on your implementation)
    expect(getByText('Profile Screen')).toBeTruthy();

    // Assert that the fetched data appears on screen
    expect(await findByText('tester@yafra.com')).toBeTruthy();
    expect(await findByText('Total Reviews: 5')).toBeTruthy();
  });

  it('calls logout when the logout button is pressed', async () => {
    (fetchUserProfile as jest.Mock).mockResolvedValueOnce({
      email: 'tester@yafra.com',
      reviewCount: 5,
    });

    const { getByTestId } = render(<ProfileScreen />);

    const logoutButton = getByTestId('logout-button');
    fireEvent.press(logoutButton);

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
    });
  });
});
