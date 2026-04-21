import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RegisterScreen from '../RegisterScreen';

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      goBack: mockGoBack,
    }),
  };
});

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

describe('RegisterScreen Navigation', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
  });

  it('navigates back when Login is pressed', () => {
    const { getByText } = render(<RegisterScreen />);

    fireEvent.press(getByText('Already have an account? Login'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('navigates back when top-right close button is pressed', () => {
    const { getByTestId } = render(<RegisterScreen />);

    fireEvent.press(getByTestId('close-back-button'));

    expect(mockGoBack).toHaveBeenCalled();
  });
});
