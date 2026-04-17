import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ReviewScreen from '../ReviewScreen';
import { submitReview } from '../../../services/reviewService';

const mockGoBack = jest.fn();

jest.mock('../../../services/reviewService', () => ({
  submitReview: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({
      params: {
        restaurant: { id: '1', name: 'Test Burger', cuisine: 'American' },
      },
    }),
    useNavigation: () => ({
      goBack: mockGoBack,
    }),
  };
});

describe('ReviewScreen Submission Logic', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
  });

  it('renders the restaurant name and a review form', () => {
    const { getByText, getByPlaceholderText } = render(<ReviewScreen />);

    expect(getByText('Review for Test Burger')).toBeTruthy();

    expect(getByPlaceholderText('Rating (1-5)')).toBeTruthy();
    expect(getByPlaceholderText('Write your review here...')).toBeTruthy();

    expect(getByText('Submit Review')).toBeTruthy();
  });

  it('navigates back after submitting a review', async () => {
    const { getByText, getByPlaceholderText } = render(<ReviewScreen />);

    fireEvent.changeText(getByPlaceholderText('Rating (1-5)'), '4');
    fireEvent.changeText(
      getByPlaceholderText('Write your review here...'),
      'Great food!',
    );

    fireEvent.press(getByText('Submit Review'));

    await waitFor(() => {
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('does not navigate back if rating is missing (validation)', () => {
    const { getByText, getByPlaceholderText } = render(<ReviewScreen />);

    fireEvent.changeText(
      getByPlaceholderText('Write your review here...'),
      'No rating given',
    );
    fireEvent.press(getByText('Submit Review'));

    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('calls the submitReview service with correct data', async () => {
    const { getByText, getByPlaceholderText } = render(<ReviewScreen />);

    fireEvent.changeText(getByPlaceholderText('Rating (1-5)'), '5');
    fireEvent.changeText(
      getByPlaceholderText('Write your review here...'),
      'Best test burger ever!',
    );

    fireEvent.press(getByText('Submit Review'));

    await waitFor(() => {
      expect(submitReview).toHaveBeenCalledWith({
        restaurant_id: '1',
        rating: 5,
        description: 'Best test burger ever!',
      });
    });
  });
});
