import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import RestaurantReviewsScreen from '../RestaurantReviewsScreen';
import { useRestaurantReviews } from '../../../hooks/useRestaurantReviews';

jest.mock('../../../hooks/useRestaurantReviews');

jest.mock('../../../components/groups/FeedCard', () => {
  const { View, Text } = jest.requireActual('react-native');
  const MockFeedCard = ({
    review,
  }: {
    review: { review_text?: string; id: string };
  }) => (
    <View>
      <Text>{review.review_text || `Review ${review.id}`}</Text>
    </View>
  );
  MockFeedCard.displayName = 'MockFeedCard';
  return MockFeedCard;
});

const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: () => ({
    params: { restaurantId: 1, restaurantName: 'Test Cafe' },
  }),
  useNavigation: () => ({
    navigate: mockNavigate,
    setOptions: mockSetOptions,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('RestaurantReviewsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a loading indicator while fetching', () => {
    (useRestaurantReviews as jest.Mock).mockReturnValue({
      reviews: [],
      isLoading: true,
      error: null,
    });

    const { getByTestId } = render(<RestaurantReviewsScreen />);
    expect(getByTestId('activity-indicator')).toBeTruthy();
  });

  it('renders an error message if fetching fails', () => {
    (useRestaurantReviews as jest.Mock).mockReturnValue({
      reviews: [],
      isLoading: false,
      error: 'Failed to load',
    });

    const { getByText } = render(<RestaurantReviewsScreen />);
    expect(getByText('Failed to load')).toBeTruthy();
  });

  it('renders a list of reviews', async () => {
    const mockReviews = [
      { id: '1', review_text: 'First review' },
      { id: '2', review_text: 'Second review' },
    ];
    (useRestaurantReviews as jest.Mock).mockReturnValue({
      reviews: mockReviews,
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<RestaurantReviewsScreen />);

    await waitFor(() => {
      expect(getByText('First review')).toBeTruthy();
      expect(getByText('Second review')).toBeTruthy();
    });
  });
});
