import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GroupFilterContextType {
  activeGroupIds: string[];
  setActiveGroupIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const GroupFilterContext = createContext<GroupFilterContextType | undefined>(
  undefined,
);

const STORAGE_KEY = '@active_group_filters';

export function GroupFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeGroupIds, setActiveGroupIds] = useState<string[]>([]);
  const isInitialized = useRef(false);

  useEffect(() => {
    const loadPersistedFilters = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setActiveGroupIds(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load group filters from storage:', error);
      } finally {
        isInitialized.current = true;
      }
    };
    loadPersistedFilters();
  }, []);

  useEffect(() => {
    if (!isInitialized.current) return;

    const persistFilters = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activeGroupIds));
      } catch (error) {
        console.error('Failed to persist group filters:', error);
      }
    };

    persistFilters();
  }, [activeGroupIds]);

  return (
    <GroupFilterContext.Provider value={{ activeGroupIds, setActiveGroupIds }}>
      {children}
    </GroupFilterContext.Provider>
  );
}

export function useGroupFilterContext() {
  const context = useContext(GroupFilterContext);
  if (!context) {
    throw new Error(
      'useGroupFilterContext must be used within a GroupFilterProvider',
    );
  }
  return context;
}
