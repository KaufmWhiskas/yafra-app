import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RestaurantMarker from '../../map/RestaurantMarker';
import RestaurantCard from '../RestaurantCard';
import { resolveRestaurantDisplay } from '../../../utils/displayState';
import { Restaurant } from '../../../types';

jest.mock('../../../utils/displayState', () => ({
  resolveRestaurantDisplay: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn().mockReturnValue(true),
}));

jest.mock('react-native-maps', () => {
  const { View } = jest.requireActual('react-native');
  return {
    Marker: ({
      children,
      testID,
    }: {
      children?: React.ReactNode;
      testID?: string;
    }) => <View testID={testID}>{children}</View>,
  };
});

const mockRestaurant = {
  id: '1',
  name: 'Test Place',
  latitude: 0,
  longitude: 0,
  cuisine: 'pizza',
} as Restaurant;

describe('RestaurantMarker UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies a solid background color to the pin container for app state', () => {
    (resolveRestaurantDisplay as jest.Mock).mockReturnValue({
      type: 'app',
      color: '#123456',
      display: '4.5',
      isHollow: false,
    });
    const { getByTestId, getByText } = render(
      <RestaurantMarker
        restaurant={mockRestaurant}
        isSelected={false}
        onPress={jest.fn()}
      />,
    );
    const markerInner = getByTestId('marker-inner');
    expect(markerInner).toHaveStyle({ backgroundColor: '#123456' });
    const textNode = getByText('4.5');
    expect(textNode).toHaveStyle({ color: '#fff' });
  });

  it('applies a white background with a colored border and text for google state', () => {
    (resolveRestaurantDisplay as jest.Mock).mockReturnValue({
      type: 'google',
      color: '#654321',
      display: '4.1',
      isHollow: true,
    });
    const { getByTestId, getByText } = render(
      <RestaurantMarker
        restaurant={mockRestaurant}
        isSelected={false}
        onPress={jest.fn()}
      />,
    );
    const markerInner = getByTestId('marker-inner');
    expect(markerInner).toHaveStyle({
      backgroundColor: '#ffffff',
      borderColor: '#654321',
    });
    const textNode = getByText('4.1');
    expect(textNode).toHaveStyle({ color: '#654321' });
  });

  it('renders a bookmark badge when bookmarked, without changing marker color', () => {
    (resolveRestaurantDisplay as jest.Mock).mockReturnValue({
      type: 'app',
      color: '#123456', // A sample color for app-rated places
      display: '4.5',
      isHollow: false,
    });
    const { getByTestId } = render(
      <RestaurantMarker
        restaurant={mockRestaurant}
        isBookmarked={true} // The restaurant is bookmarked
        isSelected={false}
        onPress={jest.fn()}
      />,
    );

    // Verify the marker itself has the app-rated color, not a bookmark color
    const markerInner = getByTestId('marker-inner');
    expect(markerInner).toHaveStyle({ backgroundColor: '#123456' });

    // Verify the bookmark badge is rendered
    const bookmarkBadge = getByTestId('bookmark-badge');
    expect(bookmarkBadge).toBeTruthy();
  });
});

describe('RestaurantCard UI', () => {
  it('renders the user_ratings_total correctly', () => {
    const mockRestaurantWithRatings = {
      id: '2',
      name: 'Ratings Place',
      latitude: 0,
      longitude: 0,
      cuisine: 'burger',
      user_ratings_total: 1234,
      rating: 4.5,
    } as Restaurant;

    const { getByText } = render(
      <RestaurantCard
        item={mockRestaurantWithRatings}
        onPressReview={jest.fn()}
        isBookmarked={false}
        onToggleBookmark={jest.fn()}
      />,
    );

    expect(getByText(/1234/)).toBeTruthy();
  });

  it('calls onPress with the restaurant when the card is tapped', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <RestaurantCard item={mockRestaurant} onPress={onPressMock} />,
    );

    fireEvent.press(getByText('Test Place'));
    expect(onPressMock).toHaveBeenCalledWith(mockRestaurant);
  });
});
