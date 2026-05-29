import React, { Component } from 'react';
import { View } from 'react-native';

class MockMapView extends Component<any> {
  // Catch any imperative calls to prevent crashes
  animateToRegion() {}
  animateToCoordinate() {}
  fitToElements() {}
  fitToCoordinates() {}

  render() {
    // Render the children (markers, etc.) inside a simple View
    return (
      <View testID={this.props.testID || 'mock-map'} {...this.props}>
        {this.props.children}
      </View>
    );
  }
}

// A simple View for the marker
const MockMarker = (props: any) => (
  <View testID={props.testID || 'restaurant-marker'} {...props} />
);

// We have to export it exactly as the real library does
export default MockMapView;
export { MockMarker as Marker };
