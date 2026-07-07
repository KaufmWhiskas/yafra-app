import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GroupFilterProvider } from '../context/GroupFilterContext';
import { useActiveGroupFilters } from '../hooks/useActiveGroupFilters';

jest.mock('@react-native-async-storage/async-storage');

describe('GroupFilterContext Storage Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves activeGroupIds to AsyncStorage when toggled', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GroupFilterProvider>{children}</GroupFilterProvider>
    );

    const { result } = renderHook(() => useActiveGroupFilters(), { wrapper });

    await act(async () => {
      result.current.toggleGroupFilter('group_789');
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@active_group_filters',
      JSON.stringify(['group_789']),
    );
  });
});
