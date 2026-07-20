import React from 'react';
import {
  render,
  waitFor,
  fireEvent,
  act,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import RestaurantDetailScreen from '../RestaurantDetailScreen';
import { fetchRestaurantDetails } from '../../../services/restaurantService';
import * as reviewService from '../../../services/reviewService';
import { supabase } from '../../../services/supabase';

jest.mock('../../../services/restaurantService', () => ({
  fetchRestaurantDetails: jest.fn(),
}));

jest.mock('../../../services/bookmarkService', () => ({
  fetchUserBookmarkedRestaurantIds: jest.fn().mockResolvedValue(new Set()),
}));

jest.mock('../../../services/reviewService', () => ({
  fetchPersonalRating: jest.fn().mockResolvedValue({ rating: 4.5, count: 2 }),
  deleteReview: jest.fn(),
  fetchReviewsForRestaurant: jest.fn().mockResolvedValue([]),
  fetchUserRestaurantHistory: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../services/groupService', () => ({
  fetchActiveGroupsReviewsForRestaurant: jest.fn().mockResolvedValue([]),
  fetchSharedGroupMemberIds: jest.fn().mockResolvedValue(new Set()),
}));

jest.mock('../../../services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../../../hooks/useRestaurantReviews', () => ({
  useRestaurantReviews: () => ({
    reviews: [],
    isLoading: false,
    error: null,
  }),
}));

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useRoute: () => ({
      params: { restaurantId: 'place_123', restaurantName: 'Test Restaurant' },
    }),
    useNavigation: () => ({
      goBack: mockGoBack,
      navigate: mockNavigate,
    }),
    useFocusEffect: (cb: () => void) => {
      const ReactActual = jest.requireActual('react');
      ReactActual.useEffect(() => {
        cb();
      }, [cb]);
    },
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('../../../components/ui/RouteButton', () => 'RouteButton');
jest.mock('../../../components/groups/FeedCard', () => 'FeedCard');
jest.mock('../../../components/ui/OpeningHours', () => 'OpeningHours');
jest.mock('../../../components/ui/RatingBadge', () => {
  const React = jest.requireActual('react');
  const { Text, TouchableOpacity } = jest.requireActual('react-native');
  function MockRatingBadge(props: {
    label?: string;
    onPress?: () => void;
    testID?: string;
  }) {
    return (
      <TouchableOpacity onPress={props.onPress} testID={props.testID}>
        <Text>{props.label}</Text>
      </TouchableOpacity>
    );
  }
  return MockRatingBadge;
});

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    session: { user: { id: 'test-user-id' } },
    isLoading: false,
  }),
}));

jest.mock('../../../components/ui/CollectionModal', () => {
  const React = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');

  const MockCollectionModal = (props: { visible: boolean }) =>
    props.visible ? (
      <View>
        <Text>Mock Collection Modal</Text>
      </View>
    ) : null;

  return {
    __esModule: true,
    default: MockCollectionModal,
  };
});

const mockSupabaseChain = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockResolvedValue({ data: [], error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
};

describe('RestaurantDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);

    (fetchRestaurantDetails as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'Test Restaurant',
      cuisine: 'American',
      latitude: 0,
      longitude: 0,
    });

    (reviewService.fetchPersonalRating as jest.Mock).mockResolvedValue({
      rating: 4.5,
      count: 2,
    });
  });

  it('renders the restaurant name from params and calls fetchRestaurantDetails', async () => {
    (fetchRestaurantDetails as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'Test Restaurant',
      cuisine: 'American',
      latitude: 0,
      longitude: 0,
      user_ratings_total: 456,
      rating: 4.5,
      address: '123 Main St',
    });

    const { findAllByText, findByText } = render(<RestaurantDetailScreen />);

    const titleElements = await findAllByText('Test Restaurant');
    expect(titleElements.length).toBeGreaterThan(0);

    expect(fetchRestaurantDetails).toHaveBeenCalledWith('place_123');

    expect(await findByText('123 Main St')).toBeTruthy();
  });

  it('opens the collection modal when the bookmark button is pressed', async () => {
    const { findByTestId, findByText } = render(<RestaurantDetailScreen />);

    await waitForElementToBeRemoved(() =>
      screen.getByTestId('activity-indicator'),
    );
    await findByText('Address not available');

    const bookmarkButton = await findByTestId('bookmark-header-button');
    fireEvent.press(bookmarkButton);

    expect(await findByText('Mock Collection Modal')).toBeTruthy();
  });

  it('navigates to ReviewScreen when "Add Review" is pressed', async () => {
    const { findByText } = render(<RestaurantDetailScreen />);

    await waitForElementToBeRemoved(() =>
      screen.getByTestId('activity-indicator'),
    );
    await findByText('Address not available');

    const reviewButton = await findByText('Add Review');
    fireEvent.press(reviewButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('ReviewScreen', {
        restaurant: expect.objectContaining({
          id: '1',
          name: 'Test Restaurant',
        }),
      });
    });
  });

  describe('Review Deletion', () => {
    it('allows user to delete a review from the history overlay list modal context', async () => {
      const mockHistoryItem = {
        id: 999,
        rating: 5,
        review_text: 'TDD Delicious!',
        visit_date: '2026-07-17',
      };

      (
        reviewService.fetchUserRestaurantHistory as jest.Mock
      ).mockResolvedValueOnce([mockHistoryItem]);

      const spyDeleteReview = (
        reviewService.deleteReview as jest.Mock
      ).mockResolvedValue({ success: true });

      const spyAlert = jest.spyOn(Alert, 'alert');

      const { findByText, getByTestId, queryByText } = render(
        <RestaurantDetailScreen />,
      );

      await waitForElementToBeRemoved(() =>
        screen.getByTestId('activity-indicator'),
      );
      await findByText('Address not available');

      const personalRatingBadge = await findByText('Yours');
      fireEvent.press(personalRatingBadge);

      expect(await findByText('"TDD Delicious!"')).toBeTruthy();

      const inlineDeleteButton = getByTestId(
        'delete-history-review-button-999',
      );
      fireEvent.press(inlineDeleteButton);

      expect(spyAlert).toHaveBeenCalledWith(
        'Delete Review',
        'Are you sure you want to delete this review?',
        expect.any(Array),
      );

      const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
      const deleteButton = alertButtons.find(
        (b: { text: string }) => b.text === 'Delete',
      );

      await act(async () => {
        if (deleteButton?.onPress) deleteButton.onPress();
      });

      await waitFor(() => {
        expect(spyDeleteReview).toHaveBeenCalledWith(999);
        expect(queryByText('"TDD Delicious!"')).toBeNull();
      });

      spyAlert.mockRestore();
    });
  });
});
