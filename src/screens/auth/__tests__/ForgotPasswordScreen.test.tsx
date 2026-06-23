import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ForgotPasswordScreen from '../ForgotPasswordScreen';
import {
  sendPasswordResetOtp,
  verifyResetOtp,
} from '../../../services/authService';

// Mock the services
jest.mock('../../../services/authService');

// Mock the custom OtpInput component to simplify testing
jest.mock('../../../components/ui/OtpInput', () => {
  const { TextInput } = jest.requireActual('react-native');
  const MockOtpInput = (props: {
    value: string;
    onChangeText: (t: string) => void;
  }) => (
    <TextInput
      testID="otp-input" // The test expects this ID
      value={props.value}
      onChangeText={props.onChangeText}
    />
  );
  MockOtpInput.displayName = 'MockOtpInput';
  return MockOtpInput;
});

// Mock navigation
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the email input step initially', () => {
    const { getByText, getByTestId } = render(<ForgotPasswordScreen />);
    expect(getByText('Reset Password')).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
  });

  it('calls sendPasswordResetOtp and transitions to OTP step on success', async () => {
    (sendPasswordResetOtp as jest.Mock).mockResolvedValue(undefined);
    const { getByTestId, findByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.press(getByTestId('send-code-button'));

    await waitFor(() => {
      expect(sendPasswordResetOtp).toHaveBeenCalledWith('test@example.com');
    });

    expect(await findByText('Enter Code')).toBeTruthy();
    expect(
      await findByText('A 6-digit code was sent to test@example.com.'),
    ).toBeTruthy();
  });

  it('shows an error if sending the OTP fails', async () => {
    const errorMessage = 'Failed to send code.';
    (sendPasswordResetOtp as jest.Mock).mockRejectedValue(
      new Error(errorMessage),
    );
    const { getByTestId, findByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.press(getByTestId('send-code-button'));

    expect(await findByText(errorMessage)).toBeTruthy();
  });

  it('calls verifyResetOtp when the user submits the code', async () => {
    (sendPasswordResetOtp as jest.Mock).mockResolvedValue(undefined);
    (verifyResetOtp as jest.Mock).mockResolvedValue(undefined);
    const { getByTestId, findByText } = render(<ForgotPasswordScreen />);

    // Transition to OTP step
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.press(getByTestId('send-code-button'));
    await findByText('Enter Code');

    // Perform OTP step
    fireEvent.changeText(getByTestId('otp-input'), '123456');
    fireEvent.press(getByTestId('verify-code-button'));

    await waitFor(() => {
      expect(verifyResetOtp).toHaveBeenCalledWith('test@example.com', '123456');
    });
  });

  it('enables the verify button only when OTP is 6 digits long', async () => {
    (sendPasswordResetOtp as jest.Mock).mockResolvedValue(undefined);
    const { getByTestId, findByText } = render(<ForgotPasswordScreen />);

    // Go to OTP step
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.press(getByTestId('send-code-button'));
    await findByText('Enter Code');

    const verifyButton = getByTestId('verify-code-button');
    expect(verifyButton.props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(getByTestId('otp-input'), '12345');
    expect(verifyButton.props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(getByTestId('otp-input'), '123456');
    expect(verifyButton.props.accessibilityState.disabled).toBe(false);
  });
});
