import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfileOtpScreen from '../ProfileOtpScreen';
import { verifyResetOtp } from '../../../services/authService';

jest.mock('../../../services/authService');

jest.mock('../../../components/ui/OtpInput', () => {
  const { TextInput } = jest.requireActual('react-native');
  const MockOtpInput = (props: {
    value: string;
    onChangeText: (t: string) => void;
  }) => (
    <TextInput
      testID="otp-input"
      value={props.value}
      onChangeText={props.onChangeText}
    />
  );
  MockOtpInput.displayName = 'MockOtpInput';
  return MockOtpInput;
});

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: { email: 'test@example.com' },
  }),
}));

jest.spyOn(Alert, 'alert');

describe('ProfileOtpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and calls verifyResetOtp on button press', async () => {
    (verifyResetOtp as jest.Mock).mockResolvedValue(undefined);
    const { getByText, getByTestId } = render(<ProfileOtpScreen />);

    expect(getByText('Enter Code')).toBeTruthy();
    expect(
      getByText('A 6-digit code was sent to test@example.com.'),
    ).toBeTruthy();

    fireEvent.changeText(getByTestId('otp-input'), '123456');
    fireEvent.press(getByTestId('verify-code-button'));

    await waitFor(() => {
      expect(verifyResetOtp).toHaveBeenCalledWith('test@example.com', '123456');
    });

    expect(mockNavigate).toHaveBeenCalledWith('UpdatePasswordScreen');
  });

  it('shows an error if verifyResetOtp fails', async () => {
    const errorMessage = 'Invalid code';
    (verifyResetOtp as jest.Mock).mockRejectedValue(new Error(errorMessage));
    const { getByTestId, findByText } = render(<ProfileOtpScreen />);

    fireEvent.changeText(getByTestId('otp-input'), '000000');
    fireEvent.press(getByTestId('verify-code-button'));

    expect(await findByText(errorMessage)).toBeTruthy();
  });

  it('disables the verify button until 6 digits are entered', () => {
    const { getByTestId } = render(<ProfileOtpScreen />);
    const verifyButton = getByTestId('verify-code-button');
    expect(verifyButton.props.accessibilityState.disabled).toBe(true);
    fireEvent.changeText(getByTestId('otp-input'), '12345');
    expect(verifyButton.props.accessibilityState.disabled).toBe(true);
    fireEvent.changeText(getByTestId('otp-input'), '123456');
    expect(verifyButton.props.accessibilityState.disabled).toBe(false);
  });
});
