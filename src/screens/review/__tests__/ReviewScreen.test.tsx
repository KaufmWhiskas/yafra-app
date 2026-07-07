import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import ReviewScreen from '../ReviewScreen';
import { submitReview } from '../../../services/reviewService';

jest.mock('../../../services/reviewService', () => ({
  submitReview: jest.fn(),
  updateReview: jest.fn(),
  fetchUserTags: jest.fn().mockResolvedValue([]),
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

jest.mock('@react-native-community/datetimepicker', () => {
  const ReactActual = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return (props: Record<string, unknown>) =>
    ReactActual.createElement(View, { testID: 'mock-date-picker', ...props });
});

jest.mock('@expo/vector-icons', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    MaterialCommunityIcons: (
      props: React.ComponentProps<typeof View>,
    ): React.ReactElement => <View {...props} />,
  };
});

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    session: { user: { id: 'test-user-id' } },
    isLoading: false,
  }),
}));

jest.spyOn(Alert, 'alert');

jest.mock('react-native', () => {
  const ActualReactNative = jest.requireActual('react-native');
  const ReactActual = jest.requireActual('react'); // Safely retrieve React within scope

  // Custom mock wrapper for KeyboardAvoidingView to preserve child node rendering pass-throughs
  // Preserve child rendering passthrough without triggering variable hoisting issues
  const MockKAV = ({
    children,
    ...props
  }: React.ComponentProps<typeof ActualReactNative.KeyboardAvoidingView>) => {
    return ReactActual.createElement(ActualReactNative.View, props, children);
  };

  return Object.defineProperty(ActualReactNative, 'KeyboardAvoidingView', {
    get: () => MockKAV,
    configurable: true,
  });
});

describe('ReviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the restaurant name and default tags', async () => {
    const { getByText, findByText } = render(<ReviewScreen />);
    expect(getByText(/Test Burger Joint/i)).toBeTruthy();

    // Expand the advanced section to reveal the tags
    fireEvent.press(getByText('Add Advanced Details (Optional)'));

    expect(await findByText('Hidden Gem')).toBeTruthy();
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
        experienceType: 'eat-in',
        tags: [],
        description: '',
        isPrivate: false,
        visitDate: expect.any(String),
      });
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('calls submitReview with advanced payload when expanded and a tag is selected', async () => {
    (submitReview as jest.Mock).mockResolvedValueOnce({ success: true });
    const { getByText, getAllByTestId, getByPlaceholderText, findByText } =
      render(<ReviewScreen />);

    // Expand Advanced details section
    fireEvent.press(getByText('Add Advanced Details (Optional)'));

    const scoreInputs = getAllByTestId('score-input');
    fireEvent.changeText(scoreInputs[0], '4.5');
    fireEvent.changeText(scoreInputs[1], '3.5');

    fireEvent.press(getByText('Takeaway'));

    const notesInput = getByPlaceholderText('What did you love or hate?');
    fireEvent.changeText(notesInput, 'Amazing burgers!');

    // SIMULATE SELECTING A TAG (Using a tag known to be in DEFAULT_TAGS)
    fireEvent.press(await findByText('Hidden Gem'));

    fireEvent.press(getByText('Submit Review'));

    await waitFor(() => {
      expect(submitReview).toHaveBeenCalledWith({
        restaurantId: 'rest_123',
        rating: 4.5,
        priceScore: 3.5,
        experienceType: 'takeaway',
        tags: ['Hidden Gem'],
        description: 'Amazing burgers!',
        isPrivate: false,
        visitDate: expect.any(String),
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

  it('configures KeyboardAvoidingView behavior and keyboardVerticalOffset according to native runtime guidelines', () => {
    const { getByTestId } = render(<ReviewScreen />);
    const keyboardAvoidingView = getByTestId('review-screen-kav');

    // Assert that keyboard offsets are specified to account for platform layout constraints
    expect(keyboardAvoidingView.props.keyboardVerticalOffset).toBe(
      Platform.OS === 'ios' ? 88 : 80,
    );
    expect(keyboardAvoidingView.props.behavior).toBe(
      Platform.OS === 'ios' ? 'padding' : 'height',
    );
  });
});
