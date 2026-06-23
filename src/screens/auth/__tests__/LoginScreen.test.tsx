import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { Alert } from 'react-native';
import { login } from '../../../services/authService';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

jest.mock('../../../services/authService', () => ({
  login: jest.fn(() => Promise.resolve({ user: { id: '123' } })),
}));

jest.spyOn(Alert, 'alert');

describe('LoginScreen Component Render Check', () => {
  it('renders the e-mail and password input fields', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('E-mail')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it("renders the Login, 'Don't have an account?' and 'Forgot Password' buttons", () => {
    const { getByText, getByTestId } = render(<LoginScreen />);

    expect(getByTestId('login-submit-button')).toBeTruthy();
    expect(getByText("Don't have an account?")).toBeTruthy();
    expect(getByText('Forgot Password')).toBeTruthy();
  });
});

describe('LoginScreen Navigation', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('navigates to RegisterScreen when Sign Up is pressed', () => {
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText("Don't have an account?"));

    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });
});

describe('LoginScreen Submission Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the login service with email and password when login is pressed', async () => {
    const { getByPlaceholderText, getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('E-mail'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'securePassword123');
    fireEvent.press(getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith(
        'test@example.com',
        'securePassword123',
      );
    });
  });

  it('shows an error alert when login fails', async () => {
    const errorMessage = 'Invalid login credentials';

    (login as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const { getByPlaceholderText, getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('E-mail'), 'test@example.com');
    fireEvent.changeText(
      getByPlaceholderText('Password'),
      'wrongSecurePassword123',
    );
    fireEvent.press(getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', errorMessage);
    });
  });
});
