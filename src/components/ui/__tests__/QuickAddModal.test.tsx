import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import QuickAddModal from '../QuickAddModal';
import { Restaurant } from '../../../types';

const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Closest Place',
    cuisine: 'Pizza',
    latitude: 0,
    longitude: 0,
  },
  {
    id: '2',
    name: 'Second Place',
    cuisine: 'Burger',
    latitude: 0,
    longitude: 0,
  },
  { id: '3', name: 'Third Place', cuisine: 'Sushi', latitude: 0, longitude: 0 },
];

jest.mock('../../../constants/categories', () => ({
  getCategoryDisplayName: (key: string) => key,
  getCategoryIconConfig: jest.fn(() => ({
    provider: 'Lucide',
    name: 'utensils',
  })),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome5: 'FontAwesome5',
  FontAwesome6: 'FontAwesome6',
}));
jest.mock('@react-native-vector-icons/lucide', () => 'Lucide');

describe('QuickAddModal', () => {
  const mockOnSelect = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the closest restaurant initially', async () => {
    const { findByText } = render(
      <QuickAddModal
        visible={true}
        restaurants={mockRestaurants}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />,
    );

    expect(await findByText('Are you here?')).toBeTruthy();
    expect(await findByText('Closest Place')).toBeTruthy();
    expect(await findByText("No, I'm somewhere else")).toBeTruthy();
  });

  it('calls onSelect with the closest restaurant when its review button is pressed', async () => {
    const { findByTestId } = render(
      <QuickAddModal
        visible={true}
        restaurants={mockRestaurants}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />,
    );

    const reviewButton = await findByTestId('add-review-button');
    fireEvent.press(reviewButton);

    expect(mockOnSelect).toHaveBeenCalledWith(mockRestaurants[0]);
  });

  it('shows other restaurants when "No, I\'m somewhere else" is pressed', async () => {
    const { getByText, findByText } = render(
      <QuickAddModal
        visible={true}
        restaurants={mockRestaurants}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />,
    );

    const noButton = await findByText("No, I'm somewhere else");
    fireEvent.press(noButton);

    expect(await findByText('Maybe one of these?')).toBeTruthy();
    expect(getByText('Second Place')).toBeTruthy();
    expect(getByText('Third Place')).toBeTruthy();
  });

  it('calls onClose when the cancel button is pressed', async () => {
    const { findByText } = render(
      <QuickAddModal
        visible={true}
        restaurants={mockRestaurants}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />,
    );

    const cancelButton = await findByText('Cancel');

    fireEvent.press(cancelButton);

    await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
  });

  it('calls onClose when the backdrop is pressed', async () => {
    const { findByTestId } = render(
      <QuickAddModal
        visible={true}
        restaurants={mockRestaurants}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />,
    );

    const backdrop = await findByTestId('modal-backdrop');
    fireEvent.press(backdrop);
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
