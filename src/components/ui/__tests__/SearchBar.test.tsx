import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SearchBar from '../SearchBar';
import { getPlacePredictions } from '../../../services/searchService';

jest.mock('../../../services/searchService', () => ({
  getPlacePredictions: jest.fn(),
}));

describe('SearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a TextInput', () => {
    const { getByPlaceholderText } = render(
      <SearchBar onPlaceSelect={jest.fn()} />,
    );
    expect(getByPlaceholderText('Search places...')).toBeTruthy();
  });

  it('debounces calls to getPlacePredictions as the user types', async () => {
    jest.useFakeTimers();
    (getPlacePredictions as jest.Mock).mockResolvedValue([]);
    const { getByPlaceholderText } = render(
      <SearchBar onPlaceSelect={jest.fn()} />,
    );

    const input = getByPlaceholderText('Search places...');
    fireEvent.changeText(input, 'Piz');
    fireEvent.changeText(input, 'Pizza');

    expect(getPlacePredictions).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(getPlacePredictions).toHaveBeenCalledTimes(1);
      expect(getPlacePredictions).toHaveBeenCalledWith(
        'Pizza',
        expect.any(String), // We expect the component to generate a sessionToken
      );
    });

    jest.useRealTimers();
  });

  it('displays the returned predictions in a list', async () => {
    (getPlacePredictions as jest.Mock).mockResolvedValue([
      { placeId: '1', description: 'Pizza Hut' },
      { placeId: '2', description: 'Dominoes Pizza' },
    ]);
    const { getByPlaceholderText, findByText } = render(
      <SearchBar onPlaceSelect={jest.fn()} />,
    );

    fireEvent.changeText(getByPlaceholderText('Search places...'), 'Piz');

    expect(await findByText('Pizza Hut')).toBeTruthy();
    expect(await findByText('Dominoes Pizza')).toBeTruthy();
  });

  it('calls an onPlaceSelect prop when a suggestion is tapped', async () => {
    const mockOnSelect = jest.fn();
    (getPlacePredictions as jest.Mock).mockResolvedValue([
      { placeId: '1', description: 'Pizza Hut' },
    ]);

    const { getByPlaceholderText, findByText } = render(
      <SearchBar onPlaceSelect={mockOnSelect} />,
    );

    fireEvent.changeText(getByPlaceholderText('Search places...'), 'Piz');

    const suggestion = await findByText('Pizza Hut');
    fireEvent.press(suggestion);

    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({ placeId: '1', description: 'Pizza Hut' }),
    );
  });
});
