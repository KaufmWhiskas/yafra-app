import React from 'react';
import { render } from '@testing-library/react-native';
import ReviewScreen from '../ReviewScreen';

jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({
      params: {
        restaurant: { id: '1', name: 'Test Burger', cuisine: 'American' },
      },
    }),
    useNavigation: () => ({
      goBack: jest.fn(),
    }),
  };
});

describe('ReviewScreen UI', () => {
  it('renders the restaurant name and a review form', () => {
    const { getByText, getByPlaceholderText } = render(<ReviewScreen />);

    expect(getByText('Review for Test Burger')).toBeTruthy();

    expect(getByPlaceholderText('Rating (1-5)')).toBeTruthy();
    expect(getByPlaceholderText('Write your review here...')).toBeTruthy();

    expect(getByText('Submit Review')).toBeTruthy();
  });
});
