import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import MainNavigator from '../MainNavigator';
import { useAuth } from '../../context/AuthContext';

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../TabNavigator', () => {
  function MockTabNavigator() {
    return null;
  }
  return MockTabNavigator;
});

describe('MainNavigator Auth Flow', () => {
  it('renders LoginScreen when there is no session', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      session: null,
      isLoading: false,
    });

    const { getByPlaceholderText } = render(<MainNavigator />);

    await waitFor(() => {
      expect(getByPlaceholderText('E-mail')).toBeTruthy();
    });
  });
});
