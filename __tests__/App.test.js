import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from '../App';

// Notice the path: goes up one level, then into src
jest.mock('../src/services/supabase', () => ({
  getMockRestaurants: jest.fn(() =>
    Promise.resolve([{ id: '1', name: 'Test Burger', cuisine: 'American' }])
  ),
}));

describe('<App />', () => {
  it('renders the main tab navigator and initial screen', async () => {
    // 1. Render the entire App
    render(<App />);

    // 2. Wait for the MapScreen to finish loading
    const mapToggleBtn = await screen.findByText('Map View');
    expect(mapToggleBtn).toBeTruthy();

    // 3. Verify that our Bottom Tabs are successfully rendered on the screen
    expect(screen.getByText('Map')).toBeTruthy();
    expect(screen.getByText('Wishlist')).toBeTruthy();
    expect(screen.getByText('Groups')).toBeTruthy();
    expect(screen.getByText('Profile')).toBeTruthy();
  });
});
