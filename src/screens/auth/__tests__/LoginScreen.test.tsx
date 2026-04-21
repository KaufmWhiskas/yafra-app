import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

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
