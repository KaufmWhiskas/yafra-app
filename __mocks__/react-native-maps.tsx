import React, { Component } from 'react';
import { View, ViewProps } from 'react-native';

/**
 * Props for the mocked MapView component.
 */
interface MockMapViewProps extends ViewProps {
  children?: React.ReactNode;
}

/**
 * Mocked implementation of react-native-maps MapView.
 * Provides empty implementations for common imperative methods to prevent
 * runtime crashes during tests.
 */
class MockMapView extends Component<MockMapViewProps> {
  animateToRegion(): void {}

  animateToCoordinate(): void {}

  fitToElements(): void {}

  fitToCoordinates(): void {}

  render(): React.ReactNode {
    return (
      <View testID={this.props.testID ?? 'mock-map'} {...this.props}>
        {this.props.children}
      </View>
    );
  }
}

/**
 * Props for the mocked Marker component.
 */
interface MockMarkerProps extends ViewProps {
  children?: React.ReactNode;
}

/**
 * Mocked implementation of react-native-maps Marker.
 */
const MockMarker = (props: MockMarkerProps): React.ReactElement => (
  <View testID={props.testID ?? 'restaurant-marker'} {...props} />
);

export default MockMapView;
export { MockMarker as Marker };
