/* eslint-disable @typescript-eslint/no-require-imports */

// Provide dummy environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock-url.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
process.env.EXPO_OS = 'ios';

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  return {
    GestureHandlerRootView: ({ children }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock('expo-crypto', () => ({
  randomUUID: () => 'mock-uuid',
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    SafeAreaConsumer: ({ children }) => children(inset),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    SafeAreaInsetsContext: React.createContext(inset),
    SafeAreaFrameContext: React.createContext({
      x: 0,
      y: 0,
      width: 390,
      height: 844,
    }),
  };
});
// Mock expo-constants to handle all ES module interop translation styles
jest.mock('expo-constants', () => {
  const mockConfig = {
    expoConfig: {
      extra: {
        supabaseUrl: 'https://mock-url.supabase.co',
        supabaseAnonKey: 'mock-anon-key',
      },
    },
  };
  return {
    ...mockConfig,
    default: mockConfig,
  };
});
