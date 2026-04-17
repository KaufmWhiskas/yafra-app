import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';

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
