/* eslint-disable @typescript-eslint/no-require-imports */

// Provide dummy environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock-url.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  return {
    GestureHandlerRootView: ({ children }) =>
      React.createElement(React.Fragment, null, children),
  };
});
