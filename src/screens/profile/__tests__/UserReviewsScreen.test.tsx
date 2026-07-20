import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, AlertButton } from 'react-native';
import UserReviewsScreen from '../UserReviewsScreen';
import * as reviewService from '../../../services/reviewService';

jest.mock('../../../services/reviewService');
const mockedFetchUserReviewedRestaurants =
  reviewService.fetchUserReviewedRestaurants as jest.Mock;
const mockedDeleteReview = reviewService.deleteReview as jest.Mock;

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => ({
    params: {
      userId: 'test-user-id',
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));
jest.spyOn(Alert, 'alert');

const mockReviews = [
  {
    id: 123,
    restaurant_id: 'rest_abc',
    user_id: 'test-user-id',
    rating: 4,
    review_text: 'Great place!',
    visit_date: '2023-10-26',
    created_at: '2023-10-26T10:00:00.000Z',
    restaurant: {
      id: 'rest_abc',
      name: 'Test Restaurant',
      cuisine: 'italian_restaurant',
    },
    metadata: { tags: ['cozy'] },
  },
];

describe('UserReviewsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetchUserReviewedRestaurants.mockResolvedValue(mockReviews);
    mockedDeleteReview.mockResolvedValue({ success: true });
    (Alert.alert as jest.Mock).mockImplementation(
      (
        _title: string,
        _message: string | undefined,
        buttons?: AlertButton[],
      ) => {
        const deleteButton = buttons?.find((b) => b.text === 'Delete');
        if (deleteButton?.onPress) {
          deleteButton.onPress();
        }
      },
    );
  });

  it('allows a user to delete their own review', async () => {
    const { getByText, findByTestId, queryByText } = render(
      <UserReviewsScreen />,
    );

    await waitFor(() => expect(getByText('Test Restaurant')).toBeTruthy());

    fireEvent.press(getByText('Show Review Details'));

    const deleteButton = await findByTestId('delete-review-button-123');
    fireEvent.press(deleteButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Review',
      'Are you sure you want to delete this review?',
      expect.any(Array),
    );

    await waitFor(() => {
      expect(mockedDeleteReview).toHaveBeenCalledWith(123);
    });

    await waitFor(() => {
      expect(queryByText('Test Restaurant')).toBeNull();
    });
  });
});
