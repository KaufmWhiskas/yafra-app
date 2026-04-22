import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import { Alert } from 'react-native';
import { logout } from '../../../services/authService';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

jest.mock('../../../services/authService', () => ({
  logout: jest.fn(() => Promise.resolve({ data: {} })),
}));

jest.spyOn(Alert, 'alert');

describe('ProfileScreen Component Render Check', () => {
  it('renders the Profile Screen text', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Profile Screen')).toBeTruthy();
  });

  it('renders the Logout button', () => {
    const { getByTestId } = render(<ProfileScreen />);
    expect(getByTestId('logout-button')).toBeTruthy();
  });
});

describe('ProfileScreen Logout Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the logout service when Logout button is pressed', async () => {
    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.press(getByTestId('logout-button'));

    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
    });
  });

  it('shows an error alert when logout fails', async () => {
    const errorMessage = 'Logout failed';

    (logout as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const { getByTestId } = render(<ProfileScreen />);

    fireEvent.press(getByTestId('logout-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Logout Failed', errorMessage);
    });
  });
});
