import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WantToVisitScreen from '../WantToVisitScreen';
import { fetchCollectionSummaries } from '../../../services/bookmarkService';
import { useAuth } from '../../../context/AuthContext';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../services/bookmarkService', () => ({
  fetchCollectionSummaries: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('WantToVisitScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: 'user_123' } },
    });
    (fetchCollectionSummaries as jest.Mock).mockResolvedValue([
      { id: 'c1', name: 'Favorites', count: 5 },
      { id: 'c2', name: 'Wishlist', count: 2 },
    ]);
  });

  it('renders a list of user collections with their item counts on mount', async () => {
    const { findByText } = render(<WantToVisitScreen />);

    expect(await findByText('Your Lists')).toBeTruthy();
    expect(await findByText('Favorites')).toBeTruthy();
    expect(await findByText('5 places')).toBeTruthy();
    expect(fetchCollectionSummaries).toHaveBeenCalledWith('user_123');
  });

  it('navigates to CollectionDetailScreen when a collection card is pressed', async () => {
    const { findByText } = render(<WantToVisitScreen />);
    const favoritesCard = await findByText('Favorites');
    fireEvent.press(favoritesCard);
    expect(mockNavigate).toHaveBeenCalledWith('CollectionDetailScreen', {
      collectionId: 'c1',
      collectionName: 'Favorites',
    });
  });
});
