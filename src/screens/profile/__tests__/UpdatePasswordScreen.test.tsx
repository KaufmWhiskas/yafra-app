import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import UpdatePasswordScreen from '../UpdatePasswordScreen';
import { updateUserPassword } from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';

jest.mock('../../../services/authService');

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

const mockSetRequiresPasswordReset = jest.fn();
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

describe('UpdatePasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      requiresPasswordReset: false, // Default to profile flow
      setRequiresPasswordReset: mockSetRequiresPasswordReset,
    });
  });

  it('renders the form correctly', () => {
    const { getByText, getByTestId } = render(<UpdatePasswordScreen />);
    expect(getByText('Set New Password')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('confirm-password-input')).toBeTruthy();
  });

  it('calls setRequiresPasswordReset on success when in forced reset flow', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      requiresPasswordReset: true, // Override for this test
      setRequiresPasswordReset: mockSetRequiresPasswordReset,
    });

    (updateUserPassword as jest.Mock).mockResolvedValue(undefined);
    const { getByTestId } = render(<UpdatePasswordScreen />);

    fireEvent.changeText(getByTestId('password-input'), 'newPassword123');
    fireEvent.changeText(
      getByTestId('confirm-password-input'),
      'newPassword123',
    );
    fireEvent.press(getByTestId('update-password-button'));

    await waitFor(() => {
      expect(updateUserPassword).toHaveBeenCalledWith('newPassword123');
    });

    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
    expect(alertArgs[0]).toBe('Success');
    const okButton = alertArgs[2].find(
      (b: { text: string }) => b.text === 'OK',
    );
    okButton.onPress();

    expect(mockSetRequiresPasswordReset).toHaveBeenCalledWith(false);
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('calls navigation.goBack on success when in profile menu flow', async () => {
    (updateUserPassword as jest.Mock).mockResolvedValue(undefined);
    const { getByTestId } = render(<UpdatePasswordScreen />);

    fireEvent.changeText(getByTestId('password-input'), 'newPassword123');
    fireEvent.changeText(
      getByTestId('confirm-password-input'),
      'newPassword123',
    );
    fireEvent.press(getByTestId('update-password-button'));

    await waitFor(() => {
      expect(updateUserPassword).toHaveBeenCalledWith('newPassword123');
    });

    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
    expect(alertArgs[0]).toBe('Success');
    const okButton = alertArgs[2].find(
      (b: { text: string }) => b.text === 'OK',
    );
    okButton.onPress();

    expect(mockGoBack).toHaveBeenCalled();
    expect(mockSetRequiresPasswordReset).not.toHaveBeenCalled();
  });

  it('shows an error if passwords do not match', async () => {
    const { getByTestId, findByText } = render(<UpdatePasswordScreen />);

    fireEvent.changeText(getByTestId('password-input'), 'newPassword123');
    fireEvent.changeText(
      getByTestId('confirm-password-input'),
      'wrongPassword',
    );
    fireEvent.press(getByTestId('update-password-button'));

    expect(await findByText('Passwords do not match.')).toBeTruthy();
    expect(updateUserPassword).not.toHaveBeenCalled();
  });
});
