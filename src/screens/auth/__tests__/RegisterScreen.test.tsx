import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../RegisterScreen';
import { register } from '../../../services/authService';

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      goBack: mockGoBack,
    }),
  };
});

jest.mock('../../../services/authService', () => ({
  register: jest.fn(() => Promise.resolve({ user: { id: '123' } })),
}));

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

describe('RegisterScreen Submission Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the register service with email and password when register is pressed', async () => {
    const { getByPlaceholderText, getByTestId } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('E-mail'), 'test@example.com');
    fireEvent.changeText(
      getByPlaceholderText('Password'),
      'reallySecurePassword123',
    );
    fireEvent.changeText(
      getByPlaceholderText('Confirm Password'),
      'reallySecurePassword123',
    );

    fireEvent.press(getByTestId('register-submit-button'));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(
        'test@example.com',
        'reallySecurePassword123',
      );
    });
  });
});
