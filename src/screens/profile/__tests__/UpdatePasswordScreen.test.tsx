import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import UpdatePasswordScreen from '../UpdatePasswordScreen';
import { updateUserPassword } from '../../../services/authService';

jest.mock('../../../services/authService');

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

jest.spyOn(Alert, 'alert');

describe('UpdatePasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form correctly', () => {
    const { getByText, getByTestId } = render(<UpdatePasswordScreen />);
    expect(getByText('Set New Password')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('confirm-password-input')).toBeTruthy();
  });

  it('calls updateUserPassword and shows success alert', async () => {
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

    expect(Alert.alert).toHaveBeenCalledWith(
      'Success',
      'Your password has been updated successfully.',
      expect.any(Array),
    );
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
