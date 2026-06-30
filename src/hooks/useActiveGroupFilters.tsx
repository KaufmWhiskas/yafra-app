import { useGroupFilterContext } from '../context/GroupFilterContext';

export function useActiveGroupFilters() {
  const { activeGroupIds, setActiveGroupIds } = useGroupFilterContext();
  const isFilterLoading = false; // Synchronous context state, no loader needed

  const toggleGroupFilter = (groupId: string) => {
    setActiveGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  return { activeGroupIds, toggleGroupFilter, isFilterLoading };
}
