import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CollectionDetailScreen from '../CollectionDetailScreen';
import {
  fetchCollectionRestaurants,
  toggleBookmarkInCollection,
} from '../../../services/bookmarkService';
import { Restaurant } from '../../../types';

jest.mock('../../../services/bookmarkService', () => ({
  fetchCollectionRestaurants: jest.fn(),
  toggleBookmarkInCollection: jest.fn(),
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ session: { user: { id: 'user_123' } } }),
}));

jest.mock('../../../constants/categories', () => ({
  getCategoryDisplayName: (key: string) => key,
  getCategoryIconConfig: jest.fn(() => ({
    provider: 'Lucide',
    name: 'utensils',
  })),
}));

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({ navigate: mockNavigate }),
    useRoute: () => ({
      params: {
        collectionId: 'coll_1',
        collectionName: 'My Favorites',
      },
    }),
  };
});

// Avoid warning regarding vector icons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome5: 'FontAwesome5',
  FontAwesome6: 'FontAwesome6',
}));
jest.mock('@react-native-vector-icons/lucide', () => 'Lucide');

jest.spyOn(Alert, 'alert');

describe('CollectionDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the collection name as the header and lists the restaurants inside it', async () => {
    (fetchCollectionRestaurants as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'Pizza Place',
        cuisine: 'pizza',
        latitude: 0,
        longitude: 0,
      },
      {
        id: '2',
        name: 'Burger Joint',
        cuisine: 'burger',
        latitude: 0,
        longitude: 0,
      },
    ] as Restaurant[]);

    const { getByText, findByText } = render(<CollectionDetailScreen />);

    expect(getByText('My Favorites')).toBeTruthy();

    expect(await findByText('Pizza Place')).toBeTruthy();
    expect(await findByText('Burger Joint')).toBeTruthy();
    expect(fetchCollectionRestaurants).toHaveBeenCalledWith('coll_1');
  });

  it('displays an empty message when no restaurants are in the collection', async () => {
    (fetchCollectionRestaurants as jest.Mock).mockResolvedValue([]);

    const { getByText, findByText } = render(<CollectionDetailScreen />);

    expect(getByText('My Favorites')).toBeTruthy();
    expect(await findByText('No restaurants in this collection.')).toBeTruthy();
  });

  it('triggers a confirmation alert and removes a restaurant from the collection when bookmark is tapped', async () => {
    const mockData = [
      {
        id: '1',
        name: 'Pizza Place',
        cuisine: 'pizza',
        latitude: 0,
        longitude: 0,
      },
    ] as Restaurant[];

    (fetchCollectionRestaurants as jest.Mock).mockResolvedValue(mockData);
    (toggleBookmarkInCollection as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = render(<CollectionDetailScreen />);
    // Allow the useEffect lifecycle queue to drain the initial data load
    await act(async () => {
      await Promise.resolve();
    });

    const bookmarkBtn = getByTestId('bookmark-button');
    fireEvent.press(bookmarkBtn);

    // Verify double-safety dialog assertion bounds
    expect(Alert.alert).toHaveBeenCalledWith(
      'Remove Restaurant',
      expect.any(String),
      expect.any(Array),
    );

    // Extract and invoke the destructive removal action trigger callback
    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const removeAction = alertButtons.find(
      (b: { text: string }) => b.text === 'Remove',
    );

    await act(async () => {
      removeAction.onPress();
    });

    expect(toggleBookmarkInCollection).toHaveBeenCalledWith(
      expect.any(String), // userId string bound checked from user context or empty fallback handler
      '1',
      'coll_1',
      true,
    );
  });
});
