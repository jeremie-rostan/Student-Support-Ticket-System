'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useTickets as useTicketsHook } from '@/hooks/useTickets';

type TicketsContextType = ReturnType<typeof useTicketsHook>;

const TicketsContext = createContext<TicketsContextType | null>(null);

export function TicketsProvider({ children }: { children: ReactNode }) {
  const tickets = useTicketsHook();

  return (
    <TicketsContext.Provider value={tickets}>
      {children}
    </TicketsContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketsContext);
  if (!context) {
    throw new Error('useTickets must be used within TicketsProvider');
  }
  return context;
}

// Keep legacy exports for backwards compatibility during migration
export const IncidentsContext = TicketsContext;
export const IncidentsProvider = TicketsProvider;
export const useIncidents = useTickets;
