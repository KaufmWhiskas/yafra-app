import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OtpInput from '../OtpInput';

describe('OtpInput', () => {
  it('renders the correct number of input cells', () => {
    const { getAllByTestId } = render(
      <OtpInput length={6} value="" onChangeText={jest.fn()} />,
    );
    const inputs = getAllByTestId(/otp-input-/);
    expect(inputs.length).toBe(6);
  });

  it('calls onChangeText when a digit is entered', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <OtpInput length={6} value="" onChangeText={handleChange} />,
    );
    const firstInput = getByTestId('otp-input-0');
    fireEvent.changeText(firstInput, '1');
    expect(handleChange).toHaveBeenCalledWith('1');
  });

  it('handles pasting a full code', () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(
      <OtpInput length={6} value="" onChangeText={handleChange} />,
    );
    const firstInput = getByTestId('otp-input-0');
    fireEvent.changeText(firstInput, '123456');
    expect(handleChange).toHaveBeenCalledWith('123456');
  });

  it('displays the value passed in props', () => {
    const { getAllByTestId } = render(
      <OtpInput length={6} value="987" onChangeText={jest.fn()} />,
    );
    const inputs = getAllByTestId(/otp-input-/);
    expect(inputs[0].props.value).toBe('9');
    expect(inputs[1].props.value).toBe('8');
    expect(inputs[2].props.value).toBe('7');
  });
});
