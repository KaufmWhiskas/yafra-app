import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
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
  const ReactActual = jest.requireActual('react');
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

    fireEvent.press(getByText('Add Detailed Highlights (Optional)'));

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
        priceScore: null,
        experienceType: 'eat-in',
        tags: [],
        description: '',
        isPrivate: false,
        visitDate: expect.any(String),
        priceTier: 2,
      });
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('calls submitReview with advanced payload when expanded and a tag is selected', async () => {
    (submitReview as jest.Mock).mockResolvedValueOnce({ success: true });
    const { getByText, getAllByTestId, getByPlaceholderText, findByText } =
      render(<ReviewScreen />);

    fireEvent.press(getByText('Add Detailed Highlights (Optional)'));

    fireEvent.press(getByText('Add Optional Price / Value Rating'));

    const scoreInputs = getAllByTestId('score-input');
    fireEvent.changeText(scoreInputs[1], '3.5');

    fireEvent.press(getByText('Takeaway'));

    const notesInput = getByPlaceholderText('What did you love or hate?');
    fireEvent.changeText(notesInput, 'Amazing burgers!');

    fireEvent.press(await findByText('Hidden Gem'));

    fireEvent.press(getByText('Submit Review'));

    await waitFor(() => {
      expect(submitReview).toHaveBeenCalledWith({
        restaurantId: 'rest_123',
        rating: 3.0,
        priceScore: 3.5,
        experienceType: 'takeaway',
        tags: ['Hidden Gem'],
        description: 'Amazing burgers!',
        isPrivate: false,
        visitDate: expect.any(String),
        priceTier: 2,
      });
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('displays an error message if the submission fails', async () => {
    (submitReview as jest.Mock).mockRejectedValueOnce(
      new Error('Network Error'),
    );
    const { getByText, findByText } = render(<ReviewScreen />);

    await act(async () => {
      fireEvent.press(getByText('Submit Review'));
    });

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

    expect(keyboardAvoidingView.props.keyboardVerticalOffset).toBe(
      Platform.OS === 'ios' ? 88 : 80,
    );
    expect(keyboardAvoidingView.props.behavior).toBe(
      Platform.OS === 'ios' ? 'padding' : 'height',
    );
  });

  it('enforces character limits on the detailed notes input field', async () => {
    const { getByText, getByPlaceholderText } = render(<ReviewScreen />);

    fireEvent.press(getByText('Add Detailed Highlights (Optional)'));

    const notesInput = getByPlaceholderText('What did you love or hate?');

    expect(notesInput.props.maxLength).toBe(500);
  });

  it('enforces a 25-character limit on custom tags', async () => {
    const { getByText, getByTestId, findByPlaceholderText } = render(
      <ReviewScreen />,
    );

    fireEvent.press(getByText('Add Detailed Highlights (Optional)'));

    const addTagButton = getByTestId('add-custom-tag-button');
    fireEvent.press(addTagButton);

    const customTagInput = await findByPlaceholderText(
      'e.g. BYOB, Cash Only, Great Cocktails',
    );
    const longTag = 'this-is-a-very-long-tag-that-is-over-25-chars';
    fireEvent.changeText(customTagInput, longTag);
    fireEvent.press(getByText('Add'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Tag Too Long',
      'Custom tags cannot be more than 25 characters.',
    );
  });
});
