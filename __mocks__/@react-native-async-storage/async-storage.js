/**
 * Manual mock implementation for the React Native AsyncStorage module.
 * Provides inline asynchronous store matrices to prevent test execution passes
 * from attempting to call native C++ side-channel environment hooks.
 */
const mockAsyncStorage = {
  setItem: jest.fn(() => Promise.resolve(null)),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  mergeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve(null)),
  multiRemove: jest.fn(() => Promise.resolve(null)),
  multiMerge: jest.fn(() => Promise.resolve(null)),
  flushGetRequests: jest.fn(),
};

export default mockAsyncStorage;
