// Provide dummy environment variables for Jest so Supabase doesn't crash on init
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock-url.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

jest.mock('@expo/vector-icons', () => {
  return {
    Ionicons: 'Ionicons',
  };
});

// Global mock for react-native-maps so no tests crash looking for native modules
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props) => <View testID="mock-map" {...props} />,
  };
});

jest.mock('@expo/vector-icons', () => {
  return {
    Ionicons: 'Ionicons',
  };
});

// Global mock for react-native-maps so no tests crash looking for native modules
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props) => <View testID="mock-map" {...props} />,
  };
});
