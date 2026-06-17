import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ReviewScreen from '../ReviewScreen';
import { submitReview } from '../../../services/reviewService';

jest.mock('../../../services/reviewService', () => ({
  submitReview: jest.fn(),
}));

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: {
        restaurant: {
          id: 'rest_123',
          name: 'Test Burger Joint',
        },
      },
    }),
  };
});

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.spyOn(Alert, 'alert');

describe('ReviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the restaurant name passed via route parameters', () => {
    const { getByText } = render(<ReviewScreen />);
    expect(getByText(/Test Burger Joint/i)).toBeTruthy();
  });

  it('calls submitReview with simple mode payload by default', async () => {
    (submitReview as jest.Mock).mockResolvedValueOnce({ success: true });
    const { getByText } = render(<ReviewScreen />);

    fireEvent.press(getByText('Submit Review'));

    await waitFor(() => {
      expect(submitReview).toHaveBeenCalledWith({
        restaurantId: 'rest_123',
        rating: 3.0,
        priceScore: 0,
        isEatIn: true,
        tags: [],
        description: '',
      });
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('calls submitReview with advanced payload when expanded', async () => {
    (submitReview as jest.Mock).mockResolvedValueOnce({ success: true });
    const { getByText, getAllByTestId, getByPlaceholderText } = render(
      <ReviewScreen />,
    );

    // Expand Advanced details section
    fireEvent.press(getByText('Add Advanced Details (Optional)'));

    const scoreInputs = getAllByTestId('score-input');
    fireEvent.changeText(scoreInputs[0], '4.5');
    fireEvent.changeText(scoreInputs[1], '3.5');

    fireEvent.press(getByText('Takeaway'));

    const notesInput = getByPlaceholderText('What did you love or hate?');
    fireEvent.changeText(notesInput, 'Amazing burgers!');

    fireEvent.press(getByText('Submit Review'));

    await waitFor(() => {
      expect(submitReview).toHaveBeenCalledWith({
        restaurantId: 'rest_123',
        rating: 4.5,
        priceScore: 3.5,
        isEatIn: false,
        tags: [],
        description: 'Amazing burgers!',
      });
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('displays an error message if the submission fails', async () => {
    (submitReview as jest.Mock).mockRejectedValueOnce(
      new Error('Network Error'),
    );
    const { getByText, findByText } = render(<ReviewScreen />);

    fireEvent.press(getByText('Submit Review'));

    expect(
      await findByText(
        'Could not save your review right now. Please check your connection and try again.',
      ),
    ).toBeTruthy();
    expect(mockGoBack).not.toHaveBeenCalled();
  });
});
