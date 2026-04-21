import React from 'react';
import { render } from '@testing-library/react-native';
import RegisterScreen from '../RegisterScreen';

describe('RegisterScreen Component Render Check', () => {
  it('renders all form elements correctly', () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(
      <RegisterScreen />,
    );

    expect(getByPlaceholderText('E-mail')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm Password')).toBeTruthy();

    expect(getByTestId('register-submit-button')).toBeTruthy();
    expect(getByText('Already have an account? Login')).toBeTruthy();
  });
});
