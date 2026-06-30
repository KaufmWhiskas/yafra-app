import React, { createContext, useContext, useState } from 'react';

interface GroupFilterContextType {
  activeGroupIds: string[];
  setActiveGroupIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const GroupFilterContext = createContext<GroupFilterContextType | undefined>(
  undefined,
);

export function GroupFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeGroupIds, setActiveGroupIds] = useState<string[]>([]);

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
