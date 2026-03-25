import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MapScreen from '../MapScreen';

// Notice the path: goes up three levels to get out of the map folder, then into services
jest.mock('../../../services/supabase', () => ({
  getMockRestaurants: jest.fn(() =>
    Promise.resolve([{ id: '1', name: 'Test Burger', cuisine: 'American' }])
  ),
}));

describe('MapScreen Toggle Feature', () => {
  it('renders the map by default after loading', async () => {
    const { findByText, getByTestId } = render(<MapScreen />);

    // 1. Wait for the UI to finish loading by looking for our toggle text
    await findByText('Map View');

    // 2. Now synchronously check that the map is on the screen
    const mapElement = getByTestId('mock-map');
    expect(mapElement).toBeTruthy();
  });

  it('toggles between Map and List view when buttons are pressed', async () => {
    const { findByText, getByTestId, queryByTestId } = render(<MapScreen />);

    const listToggleButton = await findByText('List View');
    fireEvent.press(listToggleButton);

    expect(queryByTestId('mock-map')).toBeNull();
    expect(getByTestId('list-view')).toBeTruthy();

    const mapToggleButton = await findByText('Map View');
    fireEvent.press(mapToggleButton);

    expect(getByTestId('mock-map')).toBeTruthy();
    expect(queryByTestId('list-view')).toBeNull();
  });
});
