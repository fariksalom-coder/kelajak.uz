'use client';

import { createContext, useContext } from 'react';

const ChildIdContext = createContext<string | null>(null);

export function ChildIdProvider({ childId, children }: { childId: string | null; children: React.ReactNode }) {
  return (
    <ChildIdContext.Provider value={childId}>
      {children}
    </ChildIdContext.Provider>
  );
}

export function useChildId() {
  const id = useContext(ChildIdContext);
  if (id == null) throw new Error('useChildId must be used within ChildIdProvider');
  return id;
}
