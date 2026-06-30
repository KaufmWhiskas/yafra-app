import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@yafra_active_map_groups';

export function useActiveGroupFilters() {
  const [activeGroupIds, setActiveGroupIds] = useState<string[]>([]);
  const [isFilterLoading, setIsFilterLoading] = useState(true);

  useEffect(() => {
    async function loadFilters() {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue != null) {
          setActiveGroupIds(JSON.parse(jsonValue));
        }
      } catch (e) {
        console.error('Failed to parse active group filters:', e);
      } finally {
        setIsFilterLoading(false);
      }
    }
    loadFilters();
  }, []);

  const toggleGroupFilter = async (groupId: string) => {
    const updated = activeGroupIds.includes(groupId)
      ? activeGroupIds.filter((id) => id !== groupId)
      : [...activeGroupIds, groupId];

    setActiveGroupIds(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { activeGroupIds, toggleGroupFilter, isFilterLoading };
}
