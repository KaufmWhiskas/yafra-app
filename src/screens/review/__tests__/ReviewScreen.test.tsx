import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ReviewScreen from '../ReviewScreen';
import { submitReview } from '../../../services/reviewService';

jest.mock('../../../services/reviewService', () => ({
  submitReview: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: {
        restaurant: {
          id: '123',
          name: 'Test Burger Joint',
        },
      },
    }),
  };
});

describe('ReviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the restaurant name passed via route parameters', () => {
    const { getByText } = render(<ReviewScreen />);

    expect(getByText(/Test Burger Joint/i)).toBeTruthy();
  });

  it('calls submitReview with the correct payload and navigates back on success', async () => {
    (submitReview as jest.Mock).mockResolvedValueOnce({ error: null });
    const { getByText, getByPlaceholderText } = render(<ReviewScreen />);

    fireEvent.changeText(getByPlaceholderText('Rating (1.0 - 5.0)'), '4.5');
    fireEvent.changeText(
      getByPlaceholderText('Price/Value (1.0 - 5.0)'),
      '3.5',
    );
    fireEvent.changeText(
      getByPlaceholderText('Write your review here...'),
      'Amazing burgers!',
    );

    const submitButton = getByText('Submit Review');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(submitReview).toHaveBeenCalledWith({
        restaurantId: '123',
        rating: 4.5,
        priceValueRating: 3.5,
        reviewText: 'Amazing burgers!',
      });
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('displays an error message if the submission fails', async () => {
    (submitReview as jest.Mock).mockRejectedValueOnce(
      new Error('Network Error'),
    );
    const { getByText, findByText, getByPlaceholderText } = render(
      <ReviewScreen />,
    );

    // We MUST provide valid ratings to bypass the guard clause!
    fireEvent.changeText(getByPlaceholderText('Rating (1.0 - 5.0)'), '4.0');
    fireEvent.changeText(
      getByPlaceholderText('Price/Value (1.0 - 5.0)'),
      '4.0',
    );

    fireEvent.press(getByText('Submit Review'));

    expect(await findByText('Network Error')).toBeTruthy();
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('displays a validation error if ratings are missing', async () => {
    const { getByText, findByText } = render(<ReviewScreen />);

    fireEvent.press(getByText('Submit Review'));

    expect(
      await findByText(
        'Ratings must be between 1.0 and 5.0 with up to one decimal place.',
      ),
    ).toBeTruthy();

    expect(submitReview).not.toHaveBeenCalled();
  });

  it('prevents typing invalid rating formats (forces one decimal, max 5.0)', () => {
    const { getByPlaceholderText } = render(<ReviewScreen />);

    const ratingInput = getByPlaceholderText('Rating (1.0 - 5.0)');

    fireEvent.changeText(ratingInput, '6');
    expect(ratingInput.props.value).not.toBe('6');

    fireEvent.changeText(ratingInput, '4.55');
    expect(ratingInput.props.value).toBe('4.5');

    fireEvent.changeText(ratingInput, 'abc');
    expect(ratingInput.props.value).toBe('');
  });
});
