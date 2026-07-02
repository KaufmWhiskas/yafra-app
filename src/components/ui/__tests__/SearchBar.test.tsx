import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SearchBar from '../SearchBar';
import { getPlacePredictions } from '../../../services/searchService';

jest.mock('../../../services/searchService');
jest.mock('../../../hooks/useDebounce', () => ({
  useDebounce: <T,>(value: T): T => value,
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

const mockGetPlacePredictions = getPlacePredictions as jest.Mock;

describe('SearchBar', () => {
  const mockOnPlaceSelect = jest.fn();
  const mockUserLocation = {
    latitude: 40.7128,
    longitude: -74.006,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPlacePredictions.mockResolvedValue([]);
  });

  it('calls getPlacePredictions with coordinates when user types and location is provided', async () => {
    const { getByTestId } = render(
      <SearchBar
        onPlaceSelect={mockOnPlaceSelect}
        userLocation={mockUserLocation}
      />,
    );

    fireEvent.press(getByTestId('search-bar-trigger'));
    const input = getByTestId('search-input');
    fireEvent.changeText(input, 'New York Pizza');

    await waitFor(() => {
      expect(mockGetPlacePredictions).toHaveBeenCalledTimes(1);
      expect(mockGetPlacePredictions).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'New York Pizza',
          latitude: mockUserLocation.latitude,
          longitude: mockUserLocation.longitude,
        }),
        expect.any(String),
      );
    });
  });

  it('calls getPlacePredictions without coordinates when location is not provided', async () => {
    const { getByTestId } = render(
      <SearchBar onPlaceSelect={mockOnPlaceSelect} />,
    );

    fireEvent.press(getByTestId('search-bar-trigger'));
    const input = getByTestId('search-input');
    fireEvent.changeText(input, 'Pizza');

    await waitFor(() => {
      expect(mockGetPlacePredictions).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Pizza',
          latitude: undefined,
          longitude: undefined,
        }),
        expect.any(String),
      );
    });
  });

  it('clears predictions instantly if the query string is deleted', async () => {
    mockGetPlacePredictions.mockResolvedValue([
      { placeId: '1', description: 'Stale Result' },
    ]);
    const { getByTestId, queryByText, findByText } = render(
      <SearchBar onPlaceSelect={mockOnPlaceSelect} />,
    );

    fireEvent.press(getByTestId('search-bar-trigger'));
    const input = getByTestId('search-input');

    fireEvent.changeText(input, 'Some query');
    await findByText('Stale Result');

    fireEvent.changeText(input, '');
    await waitFor(() => {
      expect(queryByText('Stale Result')).toBeNull();
    });
    expect(mockGetPlacePredictions).toHaveBeenCalledTimes(1);
  });

  it('resets the component state when the clear button is pressed', async () => {
    mockGetPlacePredictions.mockResolvedValue([
      { placeId: '1', description: 'A place' },
    ]);
    const { getByTestId, queryByText, findByText } = render(
      <SearchBar onPlaceSelect={mockOnPlaceSelect} />,
    );

    // 1. Open the search bar trigger layer first to mount the inner components safely
    fireEvent.press(getByTestId('search-bar-trigger'));

    // 2. Now target the active input node inside the modal container
    const input = getByTestId('search-input');
    fireEvent.changeText(input, 'A place');

    // 3. Wait for layout tracking to resolve predictions
    await findByText('A place');

    // 4. Target and execute clear action
    const clearButton = getByTestId('clear-button');
    fireEvent.press(clearButton);

    await waitFor(() => {
      expect(input.props.value).toBe('');
      expect(queryByText('A place')).toBeNull();
    });
  });
});
