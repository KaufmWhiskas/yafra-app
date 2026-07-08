import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ScoreSelector from '../ScoreSelector';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('ScoreSelector', () => {
  it('renders initial value and descriptor', () => {
    const { getByTestId, getByText } = render(
      <ScoreSelector value={4.6} onChange={jest.fn()} />,
    );

    expect(getByTestId('score-input').props.value).toBe('4.6');
    expect(getByText('Great')).toBeTruthy();
  });

  it('rejects numbers > 5.0 and < 1.0 on blur', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <ScoreSelector value={4.6} onChange={handleChange} />,
    );

    const input = getByTestId('score-input');

    fireEvent.changeText(input, '6.0');
    fireEvent(input, 'blur');

    expect(handleChange).toHaveBeenCalledWith(5.0);

    handleChange.mockClear();
    fireEvent.changeText(input, '0.5');
    fireEvent(input, 'blur');
    expect(handleChange).toHaveBeenCalledWith(1.0);
  });

  it('quick-increment and decrement buttons update values seamlessly', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <ScoreSelector value={4.6} onChange={handleChange} />,
    );

    fireEvent.press(getByTestId('increment-btn'));
    expect(handleChange).toHaveBeenCalledWith(4.7);
    fireEvent.press(getByTestId('decrement-btn'));
    expect(handleChange).toHaveBeenCalledWith(4.5);
  });
});
