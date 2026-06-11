import React from 'react';
import { render } from '@testing-library/react-native';
import OpeningHours from '../OpeningHours';

describe('OpeningHours', () => {
  it('renders "Opening hours not available" when hours are undefined or empty', () => {
    const { getByText } = render(<OpeningHours />);
    expect(getByText('Opening hours not available')).toBeTruthy();
  });

  it('renders a list of hours and highlights "Closed" days', () => {
    const hours = ['Monday: 9 AM - 5 PM', 'Tuesday: Closed'];
    const { getByText } = render(<OpeningHours hours={hours} />);

    expect(getByText('Monday: 9 AM - 5 PM')).toBeTruthy();

    const closedText = getByText('Tuesday: Closed');
    expect(closedText).toBeTruthy();
    expect(closedText.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#d32f2f' })]),
    );
  });
});
