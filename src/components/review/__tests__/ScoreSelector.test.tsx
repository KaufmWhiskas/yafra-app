import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ScoreSelector from '../ScoreSelector';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

describe('ScoreSelector', () => {
  it('renders initial value and descriptor', () => {
    const { getByTestId, getByText } = render(
      <ScoreSelector value={4.6} onChange={jest.fn()} />,
    );

    expect(getByTestId('score-input').props.value).toBe('4.6');
    expect(getByText('Great')).toBeTruthy();
  });

  it('quick-increment and decrement buttons update values seamlessly', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <ScoreSelector value={4.6} onChange={handleChange} />,
    );

    act(() => {
      fireEvent.press(getByTestId('increment-btn'));
    });
    expect(handleChange).toHaveBeenCalledWith(4.7);

    act(() => {
      fireEvent.press(getByTestId('decrement-btn'));
    });
    expect(handleChange).toHaveBeenCalledWith(4.5);
  });

  it('should format the descriptor with impact emojis when hitting 1.0 minimum score', () => {
    const mockOnChange = jest.fn();
    const { getByTestId } = render(
      <ScoreSelector value={1.0} onChange={mockOnChange} label="Rating" />,
    );

    const descriptor = getByTestId('score-descriptor');
    expect(descriptor.props.children).toContain('☣️');
  });
});
