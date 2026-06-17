import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import RestaurantDetailScreen from '../RestaurantDetailScreen';
import { fetchRestaurantDetails } from '../../../services/restaurantService';

jest.mock('../../../services/restaurantService', () => ({
  fetchRestaurantDetails: jest.fn(),
}));

jest.mock('../../../services/bookmarkService', () => ({
  fetchUserBookmarkedRestaurantIds: jest.fn().mockResolvedValue(new Set()),
}));

jest.mock('../../../services/reviewService', () => ({
  fetchPersonalRating: jest.fn().mockResolvedValue({ rating: 4.5, count: 2 }),
}));

jest.mock('../../../services/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  const ReactActual = jest.requireActual('react');
  return {
    ...actualNav,
    useRoute: () => ({
      params: { restaurantId: 'place_123', restaurantName: 'Test Restaurant' },
    }),
    useNavigation: () => ({
      goBack: mockGoBack,
      navigate: mockNavigate,
    }),
    useFocusEffect: (cb: React.EffectCallback) => {
      ReactActual.useEffect(() => cb(), []);
    },
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    session: { user: { id: 'test-user-id' } },
    isLoading: false,
  }),
}));

jest.mock('../../../components/ui/CollectionModal', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text } = require('react-native');
  const MockCollectionModal = (props: { visible: boolean }) =>
    props.visible ? (
      <View>
        <Text>Mock Collection Modal</Text>
      </View>
    ) : null;
  MockCollectionModal.displayName = 'MockCollectionModal';
  return MockCollectionModal;
});

describe('RestaurantDetailScreen', () => {
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

    // Wait for loading to finish and find the name in both header and body
    const titleElements = await findAllByText('Test Restaurant');
    expect(titleElements.length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(fetchRestaurantDetails).toHaveBeenCalledWith('place_123');
    });

    // Wait for the async state update to render to avoid "not wrapped in act(...)" warnings
    expect(await findByText('123 Main St')).toBeTruthy();
  });

  it('opens the collection modal when the bookmark button is pressed', async () => {
    (fetchRestaurantDetails as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'Test Restaurant',
    });

    const { getByTestId, findAllByText, findByText } = render(
      <RestaurantDetailScreen />,
    );

    // Wait for details to load so the button is enabled
    await findAllByText('Test Restaurant');

    const bookmarkButton = getByTestId('bookmark-header-button');
    fireEvent.press(bookmarkButton);

    expect(await findByText('Mock Collection Modal')).toBeTruthy();
  });

  it('navigates to ReviewScreen when "Add Review" is pressed', async () => {
    (fetchRestaurantDetails as jest.Mock).mockResolvedValue({
      id: '1',
      name: 'Test Restaurant',
      cuisine: 'American',
      latitude: 0,
      longitude: 0,
    });

    const { findByText, findAllByText } = render(<RestaurantDetailScreen />);

    await findAllByText('Test Restaurant');

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
});
