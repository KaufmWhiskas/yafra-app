import React from 'react';
import { render } from '@testing-library/react-native';
import RestaurantMarker from '../RestaurantMarker';
import { resolveRestaurantDisplay } from '../../../utils/displayState';
import { Restaurant } from '../../../types';

jest.mock('../../../utils/displayState', () => ({
  resolveRestaurantDisplay: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
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
    expect(markerInner.props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#123456' }),
    );
    const textNode = getByText('4.5');
    expect(textNode.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#fff' })]),
    );
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
    expect(markerInner.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: '#ffffff',
        borderColor: '#654321',
      }),
    );
    const textNode = getByText('4.1');
    expect(textNode.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#654321' })]),
    );
  });

  it('renders a purple pin for bookmark state', () => {
    (resolveRestaurantDisplay as jest.Mock).mockReturnValue({
      type: 'bookmark',
      color: '#673ab7',
      display: 'bookmark-icon',
      isHollow: false,
    });
    const { getByTestId } = render(
      <RestaurantMarker
        restaurant={mockRestaurant}
        isBookmarked
        isSelected={false}
        onPress={jest.fn()}
      />,
    );
    const markerInner = getByTestId('marker-inner');
    expect(markerInner.props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#673ab7' }),
    );
  });
});
