import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from '../App';

describe('<App />', () => {
  it('renders the welcome text', () => {
    // 1. Render the app using the new library
    render(<App />);

    // 2. Look for the exact text on the screen
    const welcomeText = screen.getByText('Welcome to YAFRA!');

    // 3. Assert that it exists
    expect(welcomeText).toBeTruthy();
  });
});
