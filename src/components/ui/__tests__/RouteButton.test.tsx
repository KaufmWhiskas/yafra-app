import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking, Platform } from 'react-native';
import RouteButton from '../RouteButton';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('RouteButton', () => {
  it('opens a map URL when pressed', () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByTestId } = render(
      <RouteButton latitude={40} longitude={-70} label="Test Place" />,
    );

    fireEvent.press(getByTestId('route-button'));

    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = '40,-70';
    const expectedUrl = Platform.select({
      ios: `${scheme}Test Place@${latLng}`,
      android: `${scheme}${latLng}(Test Place)`,
    });

    expect(openURLSpy).toHaveBeenCalledWith(expectedUrl);
    openURLSpy.mockRestore();
  });
});
