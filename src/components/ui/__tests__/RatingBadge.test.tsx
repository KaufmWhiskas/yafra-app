import React from 'react';
import { render } from '@testing-library/react-native';
import RatingBadge from '../RatingBadge';

describe('RatingBadge', () => {
  it('renders the label and formatted value', () => {
    const { getByText } = render(
      <RatingBadge label="Yours" value={4.56} color="#000" />,
    );
    expect(getByText('Yours')).toBeTruthy();
    expect(getByText('4.6')).toBeTruthy();
  });

  it('renders a dash when value is undefined', () => {
    const { getByText } = render(<RatingBadge label="Yours" color="#000" />);
    expect(getByText('-')).toBeTruthy();
  });

  it('renders count when provided', () => {
    const { getByText } = render(
      <RatingBadge label="Google" color="#000" count={123} />,
    );
    expect(getByText('(123)')).toBeTruthy();
  });
});
