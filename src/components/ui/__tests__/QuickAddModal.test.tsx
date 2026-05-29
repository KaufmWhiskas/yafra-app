import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import QuickAddModal from '../QuickAddModal';
import { Restaurant } from '../../../types';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, left: 0, bottom: 0, right: 0 }),
}));

const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Closest Rest',
    cuisine: 'Test',
    latitude: 0,
    longitude: 0,
    rating: 4,
  },
  {
    id: '2',
    name: 'Other Rest 1',
    cuisine: 'Test',
    latitude: 0,
    longitude: 0,
    rating: 4,
  },
  {
    id: '3',
    name: 'Other Rest 2',
    cuisine: 'Test',
    latitude: 0,
    longitude: 0,
    rating: 4,
  },
] as Restaurant[];

describe('QuickAddModal', () => {
  it('displays the closest restaurant and shows more when No is pressed', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();

    const { getByText, queryByText } = render(
      <QuickAddModal
        visible={true}
        restaurants={mockRestaurants}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );

    // Initial state: first restaurant is visible, others are not
    expect(getByText('Are you here?')).toBeTruthy();
    expect(getByText('Closest Rest')).toBeTruthy();
    expect(queryByText('Other Rest 1')).toBeNull();

    // Press "No"
    fireEvent.press(getByText("No, I'm somewhere else"));

    expect(queryByText('Closest Rest')).toBeNull();

    // Now others are visible
    expect(getByText('Maybe one of these?')).toBeTruthy();
    expect(getByText('Other Rest 1')).toBeTruthy();
    expect(getByText('Other Rest 2')).toBeTruthy();
  });
});
